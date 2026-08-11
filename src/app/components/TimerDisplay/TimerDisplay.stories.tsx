import type { Meta, StoryObj } from '@storybook/nextjs';
import TimerDisplay from './TimerDisplay';

const meta: Meta<typeof TimerDisplay> = {
  title: 'Timer/TimerDisplay',
  component: TimerDisplay,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TimerDisplay>;

export const Default: Story = {
  args: {
    timeParts: { hours: '00', minutes: '25', seconds: '00' },
    isActive: false,
    remainingSeconds: 1500,
  },
};

export const Running: Story = {
  args: {
    timeParts: { hours: '00', minutes: '24', seconds: '37' },
    isActive: true,
    remainingSeconds: 1477,
  },
};

export const LastMinute: Story = {
  args: {
    timeParts: { hours: '00', minutes: '00', seconds: '59' },
    isActive: true,
    remainingSeconds: 59,
  },
};

export const Zero: Story = {
  args: {
    timeParts: { hours: '00', minutes: '00', seconds: '00' },
    isActive: false,
    remainingSeconds: 0,
  },
};
