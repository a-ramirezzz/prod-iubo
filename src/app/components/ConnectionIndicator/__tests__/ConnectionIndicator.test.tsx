// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

let mockStatus: 'connected' | 'disconnected' | 'reconnecting' = 'connected';

vi.mock('@/hooks/useRealtimeStatus', () => ({
  useRealtimeStatus: () => ({ status: mockStatus, lastConnectedAt: null }),
}));

vi.mock('@/app/lib/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

import ConnectionIndicator from '../ConnectionIndicator';

describe('ConnectionIndicator', () => {
  beforeEach(() => {
    mockStatus = 'connected';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is hidden when connected with nothing pending', () => {
    render(<ConnectionIndicator pendingCount={0} isSyncing={false} failedCount={0} />);
    expect(screen.getByRole('status', { hidden: true }).getAttribute('aria-hidden')).toBe('true');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ConnectionIndicator pendingCount={0} isSyncing={false} failedCount={0} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows the disconnected banner with a pending-count suffix', () => {
    mockStatus = 'disconnected';
    render(<ConnectionIndicator pendingCount={3} />);
    const banner = screen.getByRole('status');
    expect(banner.getAttribute('aria-hidden')).toBe('false');
    expect(banner.textContent).toContain('app.connection.disconnected');
    expect(banner.textContent).toContain('app.connection.pendingWhileOffline');
  });

  it('shows the syncing banner while isSyncing is true, even when connected', () => {
    render(<ConnectionIndicator isSyncing pendingCount={2} failedCount={1} />);
    const banner = screen.getByRole('status');
    expect(banner.getAttribute('aria-hidden')).toBe('false');
    expect(banner.textContent).toContain('app.connection.syncing');
  });

  it('prioritizes the disconnected state over isSyncing', () => {
    mockStatus = 'reconnecting';
    render(<ConnectionIndicator isSyncing pendingCount={1} />);
    expect(screen.getByRole('status').textContent).toContain('app.connection.reconnecting');
  });

  it('shows the failed banner with a "view details" link when connected and idle', () => {
    const onOpenSyncDetails = vi.fn();
    render(<ConnectionIndicator failedCount={2} onOpenSyncDetails={onOpenSyncDetails} />);
    const banner = screen.getByRole('status');
    expect(banner.textContent).toContain('app.connection.syncFailed');
    const link = screen.getByRole('button', { name: 'app.sync.viewDetails' });
    link.click();
    expect(onOpenSyncDetails).toHaveBeenCalled();
  });

  it('does not render the details link without a failedCount', () => {
    render(<ConnectionIndicator failedCount={0} onOpenSyncDetails={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'app.sync.viewDetails' })).toBeNull();
  });
});
