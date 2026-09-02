// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import type {
  SyncQueueEntry,
  getPendingQueueEntries,
  removeQueueEntry,
  updateQueueEntryStatus,
  clearSyncQueue,
} from '@/app/lib/offlineDb';

vi.mock('@/app/lib/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

expect.extend(toHaveNoViolations);

let entries: SyncQueueEntry[] = [];
const getPendingQueueEntriesMock = vi.fn<typeof getPendingQueueEntries>(async () => entries);
const removeQueueEntryMock = vi.fn<typeof removeQueueEntry>(async () => undefined);
const updateQueueEntryStatusMock = vi.fn<typeof updateQueueEntryStatus>(async () => undefined);
const clearSyncQueueMock = vi.fn<typeof clearSyncQueue>(async () => undefined);

vi.mock('@/app/lib/offlineDb', () => ({
  getPendingQueueEntries: (...args: Parameters<typeof getPendingQueueEntries>) =>
    getPendingQueueEntriesMock(...args),
  removeQueueEntry: (...args: Parameters<typeof removeQueueEntry>) =>
    removeQueueEntryMock(...args),
  updateQueueEntryStatus: (...args: Parameters<typeof updateQueueEntryStatus>) =>
    updateQueueEntryStatusMock(...args),
  clearSyncQueue: (...args: Parameters<typeof clearSyncQueue>) => clearSyncQueueMock(...args),
}));

import SyncDetailsPanel from '../SyncDetailsPanel';

const USER = 'user-1';

function makeEntry(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
  return {
    id: 1,
    operation: 'insert',
    table: 'tasks',
    data: { id: 't1', text: 'Task' },
    status: 'pending',
    createdAt: new Date().toISOString(),
    userId: USER,
    retryCount: 0,
    ...overrides,
  };
}

describe('SyncDetailsPanel', () => {
  beforeEach(() => {
    entries = [];
    getPendingQueueEntriesMock.mockClear();
    removeQueueEntryMock.mockClear();
    updateQueueEntryStatusMock.mockClear();
    clearSyncQueueMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<SyncDetailsPanel isOpen={false} onClose={vi.fn()} userId={USER} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the empty state when there are no queued entries', async () => {
    render(<SyncDetailsPanel isOpen onClose={vi.fn()} userId={USER} />);
    await waitFor(() => expect(getPendingQueueEntriesMock).toHaveBeenCalledWith(USER));
    expect(await screen.findByText('app.sync.allSynced')).toBeTruthy();
  });

  it('lists queued entries with their status', async () => {
    entries = [makeEntry({ id: 1, status: 'pending' }), makeEntry({ id: 2, status: 'failed', lastError: 'boom' })];
    render(<SyncDetailsPanel isOpen onClose={vi.fn()} userId={USER} />);

    await waitFor(() => expect(screen.getAllByText(/app\.sync\.operationInsert/).length).toBe(2));
    expect(screen.getByText('app.sync.statusPending')).toBeTruthy();
    expect(screen.getByText('app.sync.statusFailed')).toBeTruthy();
    expect(screen.getByText(/boom/)).toBeTruthy();
  });

  it('should have no accessibility violations', async () => {
    entries = [makeEntry({ id: 1, status: 'pending' }), makeEntry({ id: 2, status: 'failed', lastError: 'boom' })];
    const { container } = render(<SyncDetailsPanel isOpen onClose={vi.fn()} userId={USER} />);

    await waitFor(() => expect(screen.getAllByText(/app\.sync\.operationInsert/).length).toBe(2));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('retries a failed entry: resets its status and triggers a sync', async () => {
    entries = [makeEntry({ id: 5, status: 'failed', lastError: 'boom' })];
    const onSyncNow = vi.fn().mockResolvedValue(undefined);
    render(<SyncDetailsPanel isOpen onClose={vi.fn()} userId={USER} onSyncNow={onSyncNow} />);

    const retryButton = await screen.findByRole('button', { name: 'app.sync.retrySingle' });
    fireEvent.click(retryButton);

    await waitFor(() => expect(updateQueueEntryStatusMock).toHaveBeenCalledWith(5, 'pending'));
    expect(onSyncNow).toHaveBeenCalled();
  });

  it('discarding a single entry requires a confirmation click', async () => {
    entries = [makeEntry({ id: 7, status: 'failed' })];
    render(<SyncDetailsPanel isOpen onClose={vi.fn()} userId={USER} />);

    const discardButton = await screen.findByRole('button', { name: 'app.sync.discardSingle' });
    fireEvent.click(discardButton);
    expect(removeQueueEntryMock).not.toHaveBeenCalled();

    const confirmButton = await screen.findByRole('button', { name: 'app.sync.discardConfirm' });
    fireEvent.click(confirmButton);
    await waitFor(() => expect(removeQueueEntryMock).toHaveBeenCalledWith(7));
  });

  it('discard all requires confirmation and clears the whole queue', async () => {
    entries = [makeEntry({ id: 1, status: 'failed' }), makeEntry({ id: 2, status: 'pending' })];
    render(<SyncDetailsPanel isOpen onClose={vi.fn()} userId={USER} />);

    const discardAll = await screen.findByRole('button', { name: 'app.sync.discardAll' });
    fireEvent.click(discardAll);
    expect(clearSyncQueueMock).not.toHaveBeenCalled();

    const confirmAll = await screen.findByRole('button', { name: 'app.sync.discardAllConfirm' });
    fireEvent.click(confirmAll);
    await waitFor(() => expect(clearSyncQueueMock).toHaveBeenCalledWith(USER));
  });

  it('closes on Escape', async () => {
    entries = [makeEntry()];
    const onClose = vi.fn();
    render(<SyncDetailsPanel isOpen onClose={onClose} userId={USER} />);
    await screen.findByRole('dialog');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
