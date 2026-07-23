// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';

// --- Supabase mock ---------------------------------------------------------

// Configurable session returned by getSession() per test.
let getSessionResult: { data: { session: unknown } } = { data: { session: null } };
// A deferred so a test can observe the "still loading" state before getSession resolves.
let getSessionResolve: ((v: { data: { session: unknown } }) => void) | null = null;
let deferGetSession = false;

// Captured onAuthStateChange callback so tests can simulate auth events.
let authCallback: ((event: string, session: unknown) => void) | null = null;

const unsubscribeMock = vi.fn();
const signOutMock = vi.fn(() => Promise.resolve());

const getSessionMock = vi.fn(() => {
  if (deferGetSession) {
    return new Promise((resolve) => {
      getSessionResolve = resolve;
    });
  }
  return Promise.resolve(getSessionResult);
});

const onAuthStateChangeMock = vi.fn((cb: (event: string, session: unknown) => void) => {
  authCallback = cb;
  return { data: { subscription: { unsubscribe: unsubscribeMock } } };
});

const mockSupabase = {
  auth: {
    getSession: getSessionMock,
    onAuthStateChange: onAuthStateChangeMock,
    signOut: signOutMock,
  },
};

vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

import { AuthProvider, useAuth } from '@/app/context/AuthContext';

// --- Test helpers ----------------------------------------------------------

function TestConsumer() {
  const { user, loading, sessionExpired, signOut } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.id ?? 'null'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="session-expired">{String(sessionExpired)}</span>
      <button data-testid="sign-out" onClick={signOut}>Sign Out</button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

// Minimal user/session factories.
const makeSession = (id: string) => ({ user: { id } });

describe('AuthContext', () => {
  beforeEach(() => {
    getSessionResult = { data: { session: null } };
    getSessionResolve = null;
    deferGetSession = false;
    authCallback = null;
    unsubscribeMock.mockClear();
    signOutMock.mockClear();
    getSessionMock.mockClear();
    onAuthStateChangeMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides initial loading state', async () => {
    deferGetSession = true; // keep getSession pending
    renderProvider();

    // getSession has not resolved yet: loading true, user null.
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('null');

    // Resolve to let the effect settle and avoid act() warnings.
    await act(async () => {
      getSessionResolve?.({ data: { session: null } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('hydrates user from existing session', async () => {
    getSessionResult = { data: { session: makeSession('user-a') } };
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-a');
    });
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('sets user to null when no session exists', async () => {
    getSessionResult = { data: { session: null } };
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('detects session expiration (SIGNED_OUT after being authenticated)', async () => {
    getSessionResult = { data: { session: makeSession('user-a') } };
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-a');
    });

    act(() => {
      authCallback?.('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('session-expired').textContent).toBe('true');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('voluntary signOut does not set sessionExpired', async () => {
    getSessionResult = { data: { session: makeSession('user-a') } };
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-a');
    });

    // User-initiated logout flags isVoluntaryLogoutRef before signOut resolves.
    await act(async () => {
      fireEvent.click(screen.getByTestId('sign-out'));
    });
    expect(signOutMock).toHaveBeenCalled();

    act(() => {
      authCallback?.('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
    expect(screen.getByTestId('session-expired').textContent).toBe('false');
  });

  it('clears sessionExpired on re-authentication', async () => {
    getSessionResult = { data: { session: makeSession('user-a') } };
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-a');
    });

    // Expire the session.
    act(() => {
      authCallback?.('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('session-expired').textContent).toBe('true');
    });

    // Re-authenticate.
    act(() => {
      authCallback?.('SIGNED_IN', makeSession('user-a'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('session-expired').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('user-a');
  });

  it('updates user on TOKEN_REFRESHED event', async () => {
    getSessionResult = { data: { session: makeSession('user-a') } };
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-a');
    });

    act(() => {
      authCallback?.('TOKEN_REFRESHED', makeSession('user-b'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-b');
    });
  });

  it('unsubscribes from auth changes on unmount', async () => {
    getSessionResult = { data: { session: null } };
    const { unmount } = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
