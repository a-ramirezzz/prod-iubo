import type { Task } from '../../types';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  inputDisabled: boolean;
}

export default function TaskList({ tasks, onToggleTask, onDeleteTask, inputDisabled }: TaskListProps) {
  if (!tasks.length) {
    return <p className={styles.noTasks}>Aún no hay tareas para esta sesión.</p>;
  }

  return (
    <ul className={styles.taskList}>
      {tasks.map(task => (
        <li key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
          <span
            className={styles.taskText}
            onClick={() => !inputDisabled && onToggleTask(task.id)}
            style={{ cursor: inputDisabled ? 'not-allowed' : 'pointer' }}
          >
            {task.text}
          </span>
          <button
            onClick={() => onDeleteTask(task.id)}
            className={styles.deleteButton}
            disabled={inputDisabled}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}