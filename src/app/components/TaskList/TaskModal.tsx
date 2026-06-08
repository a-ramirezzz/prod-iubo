import React, { useState, useEffect } from 'react';
import styles from './TaskModal.module.css';
import type { Task } from '@/app/types';
import CelebrationEffect from './CelebrationEffect';
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

// Sortable task item component for drag and drop functionality
interface SortableTaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableTaskItem({ task, onToggle, onDelete }: SortableTaskItemProps) {
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
      className={`${styles.taskItem} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        ⋮⋮
      </div>
      <label className={styles.taskLabel}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
        />
        <span className={task.completed ? styles.completed : ''}>{task.text}</span>
      </label>
      <button
        className={styles.deleteButton}
        onClick={() => onDelete(task.id)}
        aria-label="Eliminar objetivo"
        type="button"
      >
        ✕
      </button>
    </li>
  );
}

export default function TaskModal({ isOpen, onClose, tasks, onAddTask, onToggleTask, onDeleteTask, onReorderTasks }: TaskModalProps) {
  // Local state for the new task input
  const [newTask, setNewTask] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(0);

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

  // Calculate progress bar color based on percentage
  const getProgressColor = (progress: number): string => {
    if (progress === 100) return '#4caf50'; // Verde
    if (progress >= 80) return '#ffeb3b'; // Amarillo
    if (progress >= 35) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
  };

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
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Celebration effect */}
      <CelebrationEffect 
        isActive={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
      {/* Modal backdrop, closes modal on click */}
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        {/* Close button for the modal */}
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        {/* Modal title */}
        <h2 className={styles.title}>¿Cuáles son los objetivos de hoy?</h2>
        {/* Progress bar section */}
        <div className={styles.progressBarContainer}>
          <span>0%</span>
          <div className={styles.progressBarBg}>
            <div 
              className={styles.progressBarFill} 
              style={{ 
                width: `${progress}%`,
                backgroundColor: getProgressColor(progress)
              }} 
            />
          </div>
          <span>100%</span>
        </div>
        {/* Task management area */}
        <div className={styles.tasksArea}>
          {/* Form to add a new task */}
          <form onSubmit={handleAddTask} className={styles.addTaskForm}>
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Agregar un nuevo objetivo..."
              className={styles.addTaskInput}
              maxLength={80}
            />
            <button type="submit" className={styles.addTaskButton} disabled={newTask.trim() === ''}>
              +
            </button>
          </form>
          {/* List of tasks with drag and drop functionality */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              <ul className={styles.taskList}>
                {tasks.length === 0 && (
                  <li className={styles.noTasks} style={{ listStyle: 'none', textAlign: 'center', padding: '1.5rem 0' }}>
                    <span style={{ display: 'block', fontSize: '2rem', opacity: 0.4, marginBottom: '0.5rem' }}>🎯</span>
                    Aún no hay objetivos. ¡Agrega uno para comenzar!
                  </li>
                )}
                {tasks.map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </>
  );
} 