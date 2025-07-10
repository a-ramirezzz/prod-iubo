# Task Management with Drag and Drop

## Overview
This module provides a complete task management system with drag and drop reordering functionality using `@dnd-kit/core`.

## Features

### Drag and Drop Reordering
- **Visual Feedback**: Tasks show a grab cursor and visual indicators during drag operations
- **Smooth Animations**: CSS transitions provide smooth visual feedback
- **Accessibility**: Full keyboard navigation support for reordering
- **Touch Support**: Works on mobile devices with touch gestures

### Implementation Details

#### Components
- `TaskModal`: Main modal component with drag and drop functionality
- `SortableTaskItem`: Individual task item with drag handle
- `DndContext`: Wrapper for drag and drop context
- `SortableContext`: Manages sortable items

#### Key Features
- **Drag Handle**: Visual indicator (⋮⋮) for dragging tasks
- **Minimum Distance**: 8px activation constraint prevents accidental drags
- **Visual States**: 
  - Normal: Full opacity
  - Dragging: 50% opacity with rotation and shadow
  - Hover: Color changes on drag handle

#### Styling
- `.dragHandle`: Styling for the drag handle with hover effects
- `.taskItem.dragging`: Visual feedback during drag operations
- `.taskItem`: Cursor changes and transitions

## Usage

```tsx
<TaskModal
  isOpen={isOpen}
  onClose={onClose}
  tasks={tasks}
  onAddTask={handleAddTask}
  onToggleTask={handleToggleTask}
  onDeleteTask={handleDeleteTask}
  onReorderTasks={handleReorderTasks} // New prop for reordering
/>
```

## Dependencies
- `@dnd-kit/core`: Core drag and drop functionality
- `@dnd-kit/sortable`: Sortable list implementation
- `@dnd-kit/utilities`: Utility functions for transforms

## Best Practices
- Always provide visual feedback during drag operations
- Include keyboard navigation for accessibility
- Use minimum distance constraints to prevent accidental drags
- Provide clear visual indicators for draggable elements 