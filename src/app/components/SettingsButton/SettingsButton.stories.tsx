import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import SettingsButton from './SettingsButton';

const meta: Meta<typeof SettingsButton> = {
  title: 'Controls/SettingsButton',
  component: SettingsButton,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof SettingsButton>;

export const Default: Story = {};
