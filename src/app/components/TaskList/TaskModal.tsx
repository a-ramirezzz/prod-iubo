// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './TaskModal.module.css';
import type { Task } from '@/app/types';
import CelebrationEffect from './CelebrationEffect';
import { useLocale } from '@/app/lib/i18n';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks?: (tasks: Task[]) => void; // Callback for reordering tasks
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Custom circular checkbox shared by pending and completed task items
interface TaskCheckboxProps {
  taskId: string;
  checked: boolean;
  onChange: () => void;
  completedStyle?: boolean;
}

function TaskCheckbox({ taskId, checked, onChange, completedStyle }: TaskCheckboxProps) {
  const inputId = `task-modal-checkbox-${taskId}`;
  return (
    <>
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={onChange}
        className={styles.checkboxInput}
      />
      <label
        htmlFor={inputId}
        className={`${styles.checkboxCircle} ${completedStyle ? styles.checkboxCircleCompleted : ''}`}
      >
        {checked && <span className={styles.checkmark}>✓</span>}
      </label>
    </>
  );
}

// Draggable pending task item (drag-and-drop only applies to the pending section)
interface SortableTaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isCompleting: boolean;
}

function SortableTaskItem({ task, onToggle, onDelete, isCompleting }: SortableTaskItemProps) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${styles.taskItem} ${styles.pendingItem} ${isDragging ? styles.dragging : ''} ${isCompleting ? styles.completing : ''}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        ⠿
      </div>
      <TaskCheckbox taskId={task.id} checked={task.completed} onChange={() => onToggle(task.id)} />
      <label htmlFor={`task-modal-checkbox-${task.id}`} className={styles.taskText}>
        {task.text}
      </label>
      <button
        className={styles.deleteButton}
        onClick={() => onDelete(task.id)}
        aria-label={t('app.tasks.modal.deleteAria')}
        type="button"
      >
        ✕
      </button>
    </li>
  );
}

// Non-draggable task item, used for completed tasks
interface StaticTaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function StaticTaskItem({ task, onToggle, onDelete }: StaticTaskItemProps) {
  const { t } = useLocale();
  return (
    <li className={`${styles.taskItem} ${styles.completedItem}`}>
      <TaskCheckbox taskId={task.id} checked={task.completed} onChange={() => onToggle(task.id)} completedStyle />
      <label htmlFor={`task-modal-checkbox-${task.id}`} className={`${styles.taskText} ${styles.taskTextCompleted}`}>
        {task.text}
      </label>
      <button
        className={styles.deleteButton}
        onClick={() => onDelete(task.id)}
        aria-label={t('app.tasks.modal.deleteAria')}
        type="button"
      >
        ✕
      </button>
    </li>
  );
}

export default function TaskModal({ isOpen, onClose, tasks, onAddTask, onToggleTask, onDeleteTask, onReorderTasks }: TaskModalProps) {
  const { t } = useLocale();
  // Local state for the new task input
  const [newTask, setNewTask] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  // Ids of tasks mid-transition from pending to completed: kept in the pending
  // list briefly so the flash-pulse animation plays before they move sections.
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate the percentage of completed tasks
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const isAllCompleted = totalCount > 0 && progress === 100;

  // Check if we just reached 100% to trigger celebration
  useEffect(() => {
    if (progress === 100 && previousProgress < 100) {
      setShowCelebration(true);
    }
    setPreviousProgress(progress);
  }, [progress, previousProgress]);

  // Handle drag end event for reordering tasks
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over?.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorderTasks?.(newTasks);
    }
  };

  // Handler for adding a new task
  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newTask.trim() === '') return;
    onAddTask(newTask.trim());
    setNewTask('');
    inputRef.current?.focus();
  };

  // Toggling a pending task keeps it visible in the pending list for a brief
  // pulse animation before it moves to the completed section.
  const handleToggle = (task: Task) => {
    if (!task.completed) {
      setCompletingIds(prev => new Set(prev).add(task.id));
      const delay = prefersReducedMotion() ? 0 : 300;
      setTimeout(() => {
        setCompletingIds(prev => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, delay);
    }
    onToggleTask(task.id);
  };

  if (!isOpen) return null;

  const progressText = isAllCompleted
    ? t('app.tasks.modal.allCompleted')
    : t('app.tasks.modal.progress')
        .replace('{completed}', String(completedCount))
        .replace('{total}', String(totalCount));

  const pendingTasks = tasks.filter(task => !task.completed || completingIds.has(task.id));
  const completedTasks = tasks.filter(task => task.completed && !completingIds.has(task.id));
  const completedHeaderText = t('app.tasks.modal.completedHeader').replace('{count}', String(completedTasks.length));

  return createPortal(
    <>
      {/* Modal backdrop, closes modal on click */}
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          {/* Celebration effect, scoped to the modal via its containing block (see .modal transform) */}
          <CelebrationEffect
            isActive={showCelebration}
            onComplete={() => setShowCelebration(false)}
          />
          {/* Close button for the modal */}
          <button className={styles.closeButton} onClick={onClose} aria-label={t('app.tasks.modal.closeAria')}>✕</button>
          {/* Sticky header: title, progress bar and input stay visible while the list scrolls */}
          <div className={styles.header}>
            {/* Modal title */}
            <h2 className={styles.title}>{t('app.tasks.modal.title')}</h2>
            {/* Progress bar section */}
            <div className={styles.progressBarContainer}>
              <span className={styles.progressText}>{progressText}</span>
              <div className={styles.progressBarBg}>
                <div
                  className={`${styles.progressBarFill} ${isAllCompleted ? styles.progressBarComplete : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {/* Form to add a new task */}
            <form onSubmit={handleAddTask} className={styles.addTaskForm}>
              <input
                ref={inputRef}
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder={t('app.tasks.modal.placeholder')}
                className={styles.addTaskInput}
                maxLength={80}
              />
              <button
                type="submit"
                className={styles.addTaskButton}
                disabled={newTask.trim() === ''}
                aria-label={t('app.tasks.modal.addAria')}
              >
                +
              </button>
            </form>
          </div>
          {/* Task management area */}
          <div className={styles.tasksArea}>
            {totalCount === 0 && (
              <p className={styles.emptyState}>{t('app.tasks.modal.addFirstGoal')}</p>
            )}

            {isAllCompleted && (
              <div className={styles.celebrationBanner}>
                <span className={styles.celebrationEmoji}>🎯</span>
              </div>
            )}

            {/* List of pending tasks with drag and drop functionality */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={pendingTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <ul className={styles.taskList}>
                  {pendingTasks.map(task => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggle(task)}
                      onDelete={onDeleteTask}
                      isCompleting={completingIds.has(task.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>

            {/* Collapsible completed section */}
            {completedTasks.length > 0 && (
              <>
                <div className={styles.divider} />
                <button
                  type="button"
                  className={styles.completedToggle}
                  onClick={() => setIsCompletedExpanded(prev => !prev)}
                  aria-expanded={isCompletedExpanded}
                  aria-controls="task-modal-completed-list"
                  aria-label={t('app.tasks.modal.toggleCompletedAria')}
                >
                  <span className={`${styles.chevron} ${isCompletedExpanded ? styles.chevronExpanded : ''}`}>▸</span>
                  {completedHeaderText}
                </button>
                {isCompletedExpanded && (
                  <ul id="task-modal-completed-list" className={styles.taskList}>
                    {completedTasks.map(task => (
                      <StaticTaskItem
                        key={task.id}
                        task={task}
                        onToggle={() => handleToggle(task)}
                        onDelete={onDeleteTask}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
