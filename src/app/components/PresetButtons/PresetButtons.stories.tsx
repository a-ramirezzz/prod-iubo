import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import PresetButtons from './PresetButtons';

const meta: Meta<typeof PresetButtons> = {
  title: 'Timer/PresetButtons',
  component: PresetButtons,
  tags: ['autodocs'],
  args: {
    onSetTime: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof PresetButtons>;

export const Default: Story = {
  args: {
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
