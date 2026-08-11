import React from 'react';
import type { Decorator } from '@storybook/nextjs';
import { LocaleProvider } from '@/app/lib/i18n/LocaleContext';

// LocaleProvider reads from localStorage / falls back to "es" on its own,
// so it works standalone without any other app providers.
export const LocaleDecorator: Decorator = (Story) => (
  <LocaleProvider>
    <Story />
  </LocaleProvider>
);
