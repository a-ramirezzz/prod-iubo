/**
 * =================================================================
 * src/app/hooks/useTaskManager.ts
 * -----------------------------------------------------------------
 * This custom hook encapsulates all the logic related to managing
 * a list of tasks, including adding, toggling, and deleting items.
 * =================================================================
 */

// =================================================================
// SECTION: Imports
// =================================================================

import { useState, useCallback } from 'react';
import type { Task } from '@/app/types';

// =================================================================
// SECTION: Hook Definition
// =================================================================

/**
 * A custom hook to manage the state and logic for a task list.
 * It handles task creation, completion toggling, and deletion.
 * @returns {object} An object containing the task list, the current input
 * value, and memoized functions to manipulate the tasks.
 */
export const useTaskManager = () => {
  // -----------------------------------------------------------------
  // State Management
  // -----------------------------------------------------------------

  // `tasks` holds the array of all task objects.
  const [tasks, setTasks] = useState<Task[]>([]);
  // `currentTaskInput` holds the value of the new task input field.
  const [currentTaskInput, setCurrentTaskInput] = useState('');

  // -----------------------------------------------------------------
  // Memoized Handlers
  // `useCallback` is used to prevent these functions from being
  // recreated on every render, optimizing performance.
  // -----------------------------------------------------------------
  
  /**
   * Adds a new task to the list based on the current input value.
   * Prevents form submission and clears the input field on success.
   * @param {React.FormEvent<HTMLFormElement>} e - The form event.
   */
  const handleAddTask = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentTaskInput.trim() === '') return;

    const newTask: Task = {
      // Use crypto.randomUUID() for truly unique IDs instead of Date.now().
      id: crypto.randomUUID(),
      text: currentTaskInput.trim(),
      completed: false,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setCurrentTaskInput('');
  }, [currentTaskInput]); // Dependency: re-creates function only if input changes.

  /**
   * Toggles the 'completed' status of a specific task.
   * @param {string} id - The ID of the task to toggle.
   */
  const handleToggleTask = useCallback((id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []); // No dependencies needed, as it only uses the state updater function.

  /**
   * Deletes a task from the list.
   * @param {string} id - The ID of the task to delete.
   */
  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  }, []); // No dependencies needed.

  // -----------------------------------------------------------------
  // Public API
  // The values and functions returned by the hook for components to use.
  // -----------------------------------------------------------------
  
  return {
    tasks,
    currentTaskInput,
    setCurrentTaskInput,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
  };
};
