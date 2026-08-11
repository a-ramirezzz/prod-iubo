import type { Meta, StoryObj } from '@storybook/nextjs';
import LanguageSwitch from './LanguageSwitch';

const meta: Meta<typeof LanguageSwitch> = {
  title: 'Controls/LanguageSwitch',
  component: LanguageSwitch,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LanguageSwitch>;

// LanguageSwitch takes no props — it reads/writes locale via useLocale(),
// which the LocaleDecorator (.storybook/decorators) provides globally.
export const Default: Story = {};
