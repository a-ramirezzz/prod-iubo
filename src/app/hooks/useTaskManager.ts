// src/app/hooks/useTaskManager.ts
'use client';

import { useState } from 'react';
import type { Task } from '../types';

export const useTaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskInput, setCurrentTaskInput] = useState('');

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentTaskInput.trim() === '') return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: currentTaskInput.trim(),
      completed: false,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setCurrentTaskInput('');
  };

  const handleToggleTask = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  return {
    tasks,
    currentTaskInput,
    setCurrentTaskInput,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
  };
};
// Este hook se puede usar en cualquier componente que necesite manejar tareas.