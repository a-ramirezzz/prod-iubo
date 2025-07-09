import React, { useState } from 'react';
import styles from './TaskModal.module.css';
import type { Task } from '@/app/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskModal({ isOpen, onClose, tasks, onAddTask, onToggleTask, onDeleteTask }: TaskModalProps) {
  // Local state for the new task input
  const [newTask, setNewTask] = useState('');

  // Calculate the percentage of completed tasks
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

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
            <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
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
          {/* List of tasks */}
          <ul className={styles.taskList}>
            {tasks.length === 0 && (
              <li className={styles.noTasks}>Aún no hay objetivos.</li>
            )}
            {tasks.map(task => (
              <li key={task.id} className={styles.taskItem}>
                <label className={styles.taskLabel}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                  />
                  <span className={task.completed ? styles.completed : ''}>{task.text}</span>
                </label>
                <button
                  className={styles.deleteButton}
                  onClick={() => onDeleteTask(task.id)}
                  aria-label="Eliminar objetivo"
                  type="button"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
} 