// Storybook-only stand-in for src/app/hooks/useRealtimeStatus.ts.
// The real hook opens a Supabase Realtime channel, which needs live
// project credentials. Stories read the desired state off `window`
// (set per-story via `parameters.realtimeStatus`) so ConnectionIndicator
// stories can exercise disconnected/reconnecting states without Supabase.
import type { RealtimeConnectionState, RealtimeStatus } from '@/app/hooks/useRealtimeStatus';

declare global {
  interface Window {
    __STORYBOOK_REALTIME_STATUS__?: RealtimeConnectionState;
  }
}

export const useRealtimeStatus = (): RealtimeStatus => {
  const status: RealtimeConnectionState =
    (typeof window !== 'undefined' && window.__STORYBOOK_REALTIME_STATUS__) || 'connected';
  return { status, lastConnectedAt: status === 'connected' ? new Date() : null };
};
