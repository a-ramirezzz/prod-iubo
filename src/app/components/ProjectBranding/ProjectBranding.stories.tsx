import type { Meta, StoryObj } from '@storybook/nextjs';
import ProjectBranding from './ProjectBranding';

const meta: Meta<typeof ProjectBranding> = {
  title: 'Layout/ProjectBranding',
  component: ProjectBranding,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProjectBranding>;

export const Default: Story = {};
