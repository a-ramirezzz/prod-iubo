import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import ConfirmModal from './ConfirmModal';

const meta: Meta<typeof ConfirmModal> = {
  title: 'Modals/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
  args: {
    visible: true,
    onConfirm: fn(),
    onCancel: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof ConfirmModal>;

export const Default: Story = {
  args: {
    message: 'Do you want to save your changes before leaving?',
    icon: '💾',
    mode: 'confirm',
  },
};

export const Alert: Story = {
  args: {
    message: 'Your session has expired. Please log in again.',
    icon: 'ℹ️',
    mode: 'alert',
  },
};

export const Destructive: Story = {
  args: {
    message: 'This will permanently delete this task and all of its history.',
    icon: '⚠️',
    mode: 'confirm',
    destructive: true,
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
  },
};

export const Closed: Story = {
  args: {
    visible: false,
    message: 'This modal is hidden.',
  },
};
