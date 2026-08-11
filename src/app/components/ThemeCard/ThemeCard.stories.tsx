import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import ThemeCard from './ThemeCard';
import { themes } from '@/app/lib/themes';

const staticTheme = themes.find((t) => t.id === 'dark-default')!;
const videoTheme = themes.find((t) => t.id === 'animated-atardecer-light')!;

const meta: Meta<typeof ThemeCard> = {
  title: 'Settings/ThemeCard',
  component: ThemeCard,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof ThemeCard>;

export const StaticTheme: Story = {
  args: {
    theme: staticTheme,
    isSelected: false,
  },
};

export const SelectedTheme: Story = {
  args: {
    theme: staticTheme,
    isSelected: true,
  },
};

export const VideoTheme: Story = {
  args: {
    theme: videoTheme,
    isSelected: false,
  },
};
