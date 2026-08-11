import { fileURLToPath } from 'url';
import path from 'path';
import type { StorybookConfig } from '@storybook/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-onboarding'],
  framework: '@storybook/nextjs',
  staticDirs: ['../public'],
  webpackFinal: async (webpackConfig) => {
    // Redirect the Supabase-backed realtime hook to a local mock so
    // ConnectionIndicator stories don't need live Supabase credentials.
    webpackConfig.resolve = webpackConfig.resolve || {};
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '@/hooks/useRealtimeStatus': path.resolve(__dirname, 'mocks/useRealtimeStatus.ts'),
    };
    return webpackConfig;
  },
};
export default config;
