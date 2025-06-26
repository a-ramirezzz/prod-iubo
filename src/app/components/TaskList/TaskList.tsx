// app/components/TaskList/TaskList.tsx
import type { Task } from '../../types'
import styles from '../TaskList/TaskList.module.css'

/**
 * Defines the props for the TaskList component
 */
interface TaskListProps {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  inputDisabled: boolean
}

/**
 * A component that displays a list of tasks, allowing users to mark them
 * as complete or delete them
 */
export default function TaskList({ tasks, onToggleTask, onDeleteTask, inputDisabled }: TaskListProps) {
  // Display a message if there are no tasks
  if (!tasks.length) {
    return <p className={styles.noTasks}>Aún no hay tareas para esta sesión</p>
  }

  return (
    <ul className={styles.taskList}>
      {tasks.map(task => (
        <li key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
          <div className={styles.taskContent}>
            {/* Use a checkbox for better accessibility and semantics */}
            <input
              type="checkbox"
              id={`task-${task.id}`}
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
              disabled={inputDisabled}
              className={styles.checkbox}
            />
            {/* The label is associated with the checkbox */}
            <label htmlFor={`task-${task.id}`} className={styles.taskText}>
              {task.text}
            </label>
          </div>
          <button
            onClick={() => onDeleteTask(task.id)}
            className={styles.deleteButton}
            disabled={inputDisabled}
            aria-label={`Delete task: ${task.text}`} // Provides context for screen readers
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
