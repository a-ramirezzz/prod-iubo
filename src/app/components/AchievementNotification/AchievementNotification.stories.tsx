import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import AchievementNotification from './AchievementNotification';
import { ACHIEVEMENTS } from '@/app/lib/achievements';

const meta: Meta<typeof AchievementNotification> = {
  title: 'Feedback/AchievementNotification',
  component: AchievementNotification,
  tags: ['autodocs'],
  args: {
    onDismiss: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof AchievementNotification>;

export const Unlocked: Story = {
  args: {
    achievement: ACHIEVEMENTS[0], // first_session 🔥
  },
};

export const StreakLegend: Story = {
  args: {
    achievement: ACHIEVEMENTS[7], // streak_30 👑
  },
};

export const NoAchievement: Story = {
  args: {
    achievement: null,
  },
};
