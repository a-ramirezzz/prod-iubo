// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/components/TaskList/TaskList.tsx
import { useState, useEffect, useRef } from 'react'
import type { Task } from '@/app/types'
import styles from '@/app/components/TaskList/TaskList.module.css'

interface TaskListProps {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  inputDisabled: boolean
}

export default function TaskList({ tasks, onToggleTask, onDeleteTask, inputDisabled }: TaskListProps) {
  const [enteredIds, setEnteredIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
  const prevTaskIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const newIds = tasks.map(t => t.id).filter(id => !prevTaskIdsRef.current.has(id))
    if (newIds.length > 0) {
      setTimeout(() => {
        setEnteredIds(prev => new Set([...prev, ...newIds]))
      }, 10)
    }
    prevTaskIdsRef.current = new Set(tasks.map(t => t.id))
  }, [tasks])

  const handleDelete = (id: string) => {
    if (deletingIds.has(id)) return
    setDeletingIds(prev => new Set([...prev, id]))
    setTimeout(() => {
      onDeleteTask(id)
      setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }, 280)
  }

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task && !task.completed) {
      setCompletingIds(prev => new Set([...prev, id]))
      setTimeout(() => {
        setCompletingIds(prev => { const next = new Set(prev); next.delete(id); return next })
      }, 400)
    }
    onToggleTask(id)
  }

  if (!tasks.length) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyStateIcon}>📋</span>
        <span>Aún no hay tareas. ¡Agrega una para comenzar!</span>
      </div>
    )
  }

  return (
    <ul className={styles.taskList}>
      {tasks.map((task, index) => {
        const isDeleting = deletingIds.has(task.id)
        const isCompleting = completingIds.has(task.id)
        const hasEntered = enteredIds.has(task.id)

        const itemClass = [
          styles.taskItem,
          task.completed ? styles.completed : '',
          isDeleting ? styles.taskItemDelete : hasEntered ? styles.taskItemEnter : '',
          isCompleting ? styles.taskItemComplete : '',
        ].filter(Boolean).join(' ')

        return (
          <li
            key={task.id}
            className={itemClass}
            style={{ animationDelay: hasEntered && !isDeleting ? `${index * 0.06}s` : undefined }}
          >
            <div className={styles.taskContent}>
              <input
                type="checkbox"
                id={`task-${task.id}`}
                checked={task.completed}
                onChange={() => handleToggle(task.id)}
                disabled={inputDisabled}
                className={styles.checkbox}
              />
              <label htmlFor={`task-${task.id}`} className={styles.taskText}>
                {task.text}
              </label>
            </div>
            <button
              onClick={() => handleDelete(task.id)}
              className={styles.deleteButton}
              disabled={inputDisabled || isDeleting}
              aria-label={`Delete task: ${task.text}`}
            >
              ✕
            </button>
          </li>
        )
      })}
    </ul>
  )
}
