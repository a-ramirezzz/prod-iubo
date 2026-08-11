import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import ConnectionIndicator from './ConnectionIndicator';
import type { RealtimeConnectionState } from '@/app/hooks/useRealtimeStatus';

declare global {
  interface Window {
    __STORYBOOK_REALTIME_STATUS__?: RealtimeConnectionState;
  }
}

// ConnectionIndicator reads its base connection state from useRealtimeStatus,
// which Storybook aliases to a mock (see .storybook/main.ts) that returns
// whatever `window.__STORYBOOK_REALTIME_STATUS__` is set to. This decorator
// sets that value before each story mounts.
function withRealtimeStatus(status: RealtimeConnectionState): Decorator {
  return (Story) => {
    window.__STORYBOOK_REALTIME_STATUS__ = status;
    return <Story />;
  };
}

const meta: Meta<typeof ConnectionIndicator> = {
  title: 'Status/ConnectionIndicator',
  component: ConnectionIndicator,
  tags: ['autodocs'],
  args: {
    onOpenSyncDetails: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof ConnectionIndicator>;

export const Online: Story = {
  decorators: [withRealtimeStatus('connected')],
  args: {},
};

export const Offline: Story = {
  decorators: [withRealtimeStatus('disconnected')],
  args: {
    pendingCount: 3,
  },
};

export const Reconnecting: Story = {
  decorators: [withRealtimeStatus('reconnecting')],
  args: {},
};

export const Syncing: Story = {
  decorators: [withRealtimeStatus('connected')],
  args: {
    isSyncing: true,
    pendingCount: 5,
  },
};

export const SyncFailed: Story = {
  decorators: [withRealtimeStatus('connected')],
  args: {
    failedCount: 2,
  },
};
