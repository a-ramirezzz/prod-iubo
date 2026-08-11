import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import FocusMode from './FocusMode';

const meta: Meta<typeof FocusMode> = {
  title: 'Overlays/FocusMode',
  component: FocusMode,
  tags: ['autodocs'],
  args: {
    onToggleTimer: fn(),
    onExit: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;
type Story = StoryObj<typeof FocusMode>;

export const Working: Story = {
  args: {
    timeDisplay: '24:37',
    isRunning: true,
    currentPhase: 'work',
    taskText: 'Building Storybook',
  },
};

export const Paused: Story = {
  args: {
    timeDisplay: '18:42',
    isRunning: false,
    currentPhase: 'work',
    taskText: 'Code review',
  },
};

export const ShortBreak: Story = {
  args: {
    timeDisplay: '04:15',
    isRunning: true,
    currentPhase: 'short_break',
    taskText: null,
  },
};

export const LongBreak: Story = {
  args: {
    timeDisplay: '14:59',
    isRunning: true,
    currentPhase: 'long_break',
    taskText: null,
  },
};

export const LastSeconds: Story = {
  args: {
    timeDisplay: '00:05',
    isRunning: true,
    currentPhase: 'work',
    taskText: 'Almost done!',
  },
};

export const NoTask: Story = {
  args: {
    timeDisplay: '25:00',
    isRunning: false,
    currentPhase: 'work',
    taskText: null,
  },
};
