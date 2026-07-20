/**
 * =================================================================
 * src/app/hooks/useTaskManager.ts
 * -----------------------------------------------------------------
 * This custom hook encapsulates all the logic related to managing
 * a list of tasks persisted in Supabase, including adding, toggling,
 * deleting and reordering items, with real-time sync across
 * tabs/devices via Supabase Realtime.
 * =================================================================
 */

// =================================================================
// SECTION: Imports
// =================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import type { Task } from '@/app/types';

// Shape of a row in the `tasks` table as delivered by Realtime.
interface TaskRow {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  position: number;
}

const sortByPosition = (list: Task[]) =>
  [...list].sort((a, b) => a.position - b.position);

// =================================================================
// SECTION: Hook Definition
// =================================================================

/**
 * A custom hook to manage the state and logic for a task list backed
 * by Supabase. All writes are optimistic: local state updates first,
 * the Supabase call runs asynchronously, and on error the state is
 * reverted to the pre-mutation snapshot.
 * @param userId - The authenticated user's id, or null when signed out.
 */
export const useTaskManager = (userId: string | null) => {
  const supabase = createClient();

  // -----------------------------------------------------------------
  // State Management
  // -----------------------------------------------------------------

  // `tasks` holds the array of all task objects, ordered by position.
  const [tasks, setTasks] = useState<Task[]>([]);
  // `loading` is true while the initial fetch is in progress.
  const [loading, setLoading] = useState(true);
  // `currentTaskInput` holds the value of the new task input field
  // (local UI convenience state, never persisted).
  const [currentTaskInput, setCurrentTaskInput] = useState('');

  // Ref mirror so write handlers can snapshot without re-creating.
  const tasksRef = useRef<Task[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // -----------------------------------------------------------------
  // Initial fetch + Realtime subscription
  // -----------------------------------------------------------------

  useEffect(() => {
    if (!userId) {
      // Signed out: behave as a local-only, empty list.
      setTasks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, text, completed, position')
          .eq('user_id', userId)
          .order('position', { ascending: true });
        if (cancelled) return;
        if (error) {
          console.error('[useTaskManager] Error fetching tasks:', error);
        } else if (data) {
          setTasks(data as Task[]);
        }
      } catch (err) {
        if (!cancelled) console.error('[useTaskManager] Error fetching tasks:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTasks();

    // Realtime: keep this tab in sync with changes from other
    // tabs/devices. Self-originated INSERTs are deduplicated because
    // optimistic updates already added the task locally.
    let hasSubscribedOnce = false;
    const channel = supabase
      .channel(`tasks-sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as TaskRow;
          setTasks((prev) => {
            if (prev.some((t) => t.id === row.id)) return prev; // already added optimistically
            return sortByPosition([
              ...prev,
              { id: row.id, text: row.text, completed: row.completed, position: row.position },
            ]);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as TaskRow;
          setTasks((prev) =>
            sortByPosition(
              prev.map((t) =>
                t.id === row.id
                  ? { ...t, text: row.text, completed: row.completed, position: row.position }
                  : t
              )
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.old as Partial<TaskRow>;
          if (!row.id) return;
          setTasks((prev) => prev.filter((t) => t.id !== row.id));
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // On initial subscription or reconnection after a drop,
          // refetch all tasks to reconcile any changes missed while offline.
          // Skip the very first SUBSCRIBED (the mount fetch already ran).
          if (hasSubscribedOnce) {
            fetchTasks();
          }
          hasSubscribedOnce = true;
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[useTaskManager] Realtime channel error:', err);
        }
        if (status === 'TIMED_OUT') {
          console.error('[useTaskManager] Realtime channel timed out — will auto-retry');
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // -----------------------------------------------------------------
  // Memoized Handlers (optimistic writes: snapshot → update → sync →
  // revert on error)
  // -----------------------------------------------------------------

  /**
   * Adds a new task at the end of the list.
   * @param {string} text - The task text (trimmed before saving).
   */
  const handleAddTask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed === '') return;

      const snapshot = tasksRef.current;
      const position =
        snapshot.length === 0 ? 0 : Math.max(...snapshot.map((t) => t.position)) + 1;
      const newTask: Task = {
        id: crypto.randomUUID(),
        text: trimmed,
        completed: false,
        position,
      };

      setTasks((prev) => [...prev, newTask]);

      if (!userId) return; // Signed out: local-only.
      supabase
        .from('tasks')
        .insert({
          id: newTask.id,
          user_id: userId,
          text: newTask.text,
          completed: false,
          position,
        })
        .then(({ error }) => {
          if (error) {
            console.error('[useTaskManager] Error adding task:', error);
            setTasks(snapshot);
          }
        });
    },
    [userId, supabase]
  );

  /**
   * Toggles the 'completed' status of a specific task.
   * @param {string} id - The ID of the task to toggle.
   */
  const handleToggleTask = useCallback(
    (id: string) => {
      const snapshot = tasksRef.current;
      const target = snapshot.find((t) => t.id === id);
      if (!target) return;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );

      if (!userId) return;
      supabase
        .from('tasks')
        .update({ completed: !target.completed, updated_at: new Date().toISOString() })
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('[useTaskManager] Error toggling task:', error);
            setTasks(snapshot);
          }
        });
    },
    [userId, supabase]
  );

  /**
   * Deletes a task from the list.
   * @param {string} id - The ID of the task to delete.
   */
  const handleDeleteTask = useCallback(
    (id: string) => {
      const snapshot = tasksRef.current;

      setTasks((prev) => prev.filter((task) => task.id !== id));

      if (!userId) return;
      supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('[useTaskManager] Error deleting task:', error);
            setTasks(snapshot);
          }
        });
    },
    [userId, supabase]
  );

  /**
   * Reorders the task list based on drag and drop operations.
   * Only rows whose position actually changed are written to Supabase.
   * @param {Task[]} newTasks - The new ordered array of tasks.
   */
  const handleReorderTasks = useCallback(
    (newTasks: Task[]) => {
      const snapshot = tasksRef.current;
      const reordered = newTasks.map((task, index) => ({ ...task, position: index }));

      setTasks(reordered);

      if (!userId) return;
      const changed = reordered.filter((task) => {
        const before = snapshot.find((t) => t.id === task.id);
        return !before || before.position !== task.position;
      });
      if (changed.length === 0) return;

      Promise.all(
        changed.map((task) =>
          supabase
            .from('tasks')
            .update({ position: task.position, updated_at: new Date().toISOString() })
            .eq('id', task.id)
        )
      ).then((results) => {
        const failed = results.find((r) => r.error);
        if (failed) {
          console.error('[useTaskManager] Error reordering tasks:', failed.error);
          setTasks(snapshot);
        }
      });
    },
    [userId, supabase]
  );

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  return {
    tasks,
    loading,
    currentTaskInput,
    setCurrentTaskInput,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleReorderTasks,
  };
};
