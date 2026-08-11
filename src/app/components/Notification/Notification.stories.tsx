import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import Notification from './Notification';

const meta: Meta<typeof Notification> = {
  title: 'Feedback/Notification',
  component: Notification,
  tags: ['autodocs'],
  args: {
    visible: true,
    onClose: fn(),
    duration: 8000,
  },
};
export default meta;
type Story = StoryObj<typeof Notification>;

export const Success: Story = {
  args: {
    message: 'Your task was saved successfully.',
    icon: '✅',
  },
};

export const Error: Story = {
  args: {
    message: 'Something went wrong while syncing your data.',
    icon: '⚠️',
  },
};

export const NoIcon: Story = {
  args: {
    message: 'A plain notification with no icon.',
  },
};
