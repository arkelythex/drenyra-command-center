import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { type PropsWithChildren } from 'react';
import { useAuthSession } from '../useAuthSession';
import type { User, Session } from '../../types/auth.types';
import { DEMO_ACCESS_STORAGE_KEY } from '../../lib/demo-access';
import { readAuthSessionSnapshot } from '../../lib/auth-session-snapshot';

vi.mock('../../lib/auth-session-snapshot', () => ({
  readAuthSessionSnapshot: vi.fn(),
}));

// Mock useAuthStore
const mockSetSession = vi.fn();
let mockIsAuthenticatedInStore = false;

vi.mock('../useAuth', () => ({
  useAuthStore: (
    selector?: (state: {
      setSession: typeof mockSetSession;
      isAuthenticated: boolean;
    }) => unknown,
  ) => {
    const state = {
      setSession: mockSetSession,
      isAuthenticated: mockIsAuthenticatedInStore,
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useAuthSession', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@empresa.com',
    name: 'Test User',
    ruc: '20123456789',
    emailVerified: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    role: 'ADMIN',
    banned: false,
    banReason: null,
    banExpires: null,
  };

  const mockSession: Session = {
    id: 'session-123',
    userId: 'user-123',
    expiresAt: new Date('2026-01-31'),
    token: 'mock-token',
    ipAddress: '192.168.1.1',
    userAgent: 'Test Browser',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticatedInStore = false;
    localStorage.clear();
  });

  it('should return session data when authenticated', async () => {
    vi.mocked(readAuthSessionSnapshot).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    const { result } = renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should return null when not authenticated', async () => {
    vi.mocked(readAuthSessionSnapshot).mockResolvedValue(null);

    const { result } = renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should expose synthetic demo access when no Better Auth session exists', async () => {
    localStorage.setItem(
      DEMO_ACCESS_STORAGE_KEY,
      JSON.stringify({
        enabled: true,
        companyId: '00000000-0000-0000-0000-000000000001',
        companyName: 'NEBULA OPERACIONES LOGISTICAS S.A.C.',
        ruc: '20608451231',
        countryCode: 'pe',
        taxRegime: 'RMT',
        completedAt: '2026-03-03T10:00:00.000Z',
      }),
    );

    vi.mocked(readAuthSessionSnapshot).mockResolvedValue(null);

    const { result } = renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.companyName).toBe('NEBULA OPERACIONES LOGISTICAS S.A.C.');
      expect(result.current.session?.id).toBe('demo-session');
    });

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            companyId: '00000000-0000-0000-0000-000000000001',
          }),
        }),
      );
    });
  });

  it('should show loading state during session check', () => {
    let resolveSnapshot: (value: { user: User; session: Session } | null) => void = () => {};
    vi.mocked(readAuthSessionSnapshot).mockReturnValue(
      new Promise((resolve) => {
        resolveSnapshot = resolve;
      }),
    );

    const { result } = renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    resolveSnapshot(null);
  });

  it('should sync session data to Zustand store', async () => {
    vi.mocked(readAuthSessionSnapshot).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    // Assert
    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        user: mockUser,
        session: mockSession,
      });
    });
  });

  it('merges the persisted company context into the live Better Auth session user', async () => {
    localStorage.setItem(
      'arkelythex-auth',
      JSON.stringify({
        state: {
          user: {
            legacyUserId: '11111111-1111-1111-1111-111111111111',
            companyId: 'cmp-1',
            companyName: 'NEBULA OPERACIONES LOGISTICAS S.A.C.',
            ruc: '20608451231',
          },
        },
      }),
    );

    vi.mocked(readAuthSessionSnapshot).mockResolvedValue({
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        emailVerified: true,
      },
      session: mockSession,
    });

    const { result } = renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.user).toMatchObject({
        legacyUserId: '11111111-1111-1111-1111-111111111111',
        companyId: 'cmp-1',
        companyName: 'NEBULA OPERACIONES LOGISTICAS S.A.C.',
        ruc: '20608451231',
      });
    });

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        user: expect.objectContaining({
          legacyUserId: '11111111-1111-1111-1111-111111111111',
          companyId: 'cmp-1',
          companyName: 'NEBULA OPERACIONES LOGISTICAS S.A.C.',
        }),
        session: mockSession,
      });
    });
  });

  it('should clear Zustand store when session becomes null', async () => {
    vi.mocked(readAuthSessionSnapshot).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    const firstRender = renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        user: mockUser,
        session: mockSession,
      });
    });

    firstRender.unmount();
    mockSetSession.mockClear();
    mockIsAuthenticatedInStore = true;
    vi.mocked(readAuthSessionSnapshot).mockResolvedValue(null);
    renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(null);
    });
  });

  it('should not sync during loading state', () => {
    let resolveSnapshot: (value: { user: User; session: Session } | null) => void = () => {};
    vi.mocked(readAuthSessionSnapshot).mockReturnValue(
      new Promise((resolve) => {
        resolveSnapshot = resolve;
      }),
    );

    renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    expect(mockSetSession).not.toHaveBeenCalled();
    resolveSnapshot(null);
  });

  it('should return error when session fetch fails', async () => {
    const mockError = new Error('Session fetch failed');
    vi.mocked(readAuthSessionSnapshot).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuthSession(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
