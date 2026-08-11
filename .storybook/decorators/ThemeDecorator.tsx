import React, { useEffect } from 'react';
import type { Decorator } from '@storybook/nextjs';

// The app's CSS variables (--bg-color, --text-color-primary, --panel-bg, ...)
// are only defined once ThemeWrapper adds "light-mode"/"dark-mode" to
// <html> at runtime (see src/app/components/ThemeWrapper/ThemeWrapper.tsx).
// Stories render without that provider, so apply the dark-mode class
// directly to the preview iframe's root element.
export const ThemeDecorator: Decorator = (Story) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light-mode', 'dark-mode');
    root.classList.add('dark-mode');
  }, []);

  return <Story />;
};
