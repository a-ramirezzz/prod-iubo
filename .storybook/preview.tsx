import type { Preview } from '@storybook/nextjs';
import '../src/app/globals.css';
import { ThemeDecorator } from './decorators/ThemeDecorator';
import { LocaleDecorator } from './decorators/LocaleDecorator';

const preview: Preview = {
  decorators: [LocaleDecorator, ThemeDecorator],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#f8f9fa' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
