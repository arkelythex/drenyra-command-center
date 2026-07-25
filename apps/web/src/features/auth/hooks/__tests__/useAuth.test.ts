import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, User } from "../../types/auth.types";
import { useAuthStore } from "../useAuth";

vi.mock("@/lib/api-client", () => ({
	api: {
		api: {
			auth: {
				login: {
					post: vi.fn(),
				},
			},
		},
	},
}));

// Mock auth client
vi.mock("@/lib/auth-client", () => ({
	authClient: {
		signIn: {
			email: vi.fn(),
		},
		signOut: vi.fn(),
		getSession: vi.fn(),
	},
}));

vi.mock("@/lib/company-context", () => ({
	clearActiveCompanyContext: vi.fn(),
	mergeUserWithStoredCompanyContext: vi.fn((user: unknown) => user),
	syncActiveCompanyContextFromUser: vi.fn(),
}));

vi.mock("../../lib/auth-session-snapshot", () => ({
	readAuthSessionSnapshot: vi.fn(),
}));

vi.mock("@/lib/monitoring", () => ({
	captureError: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { readAuthSessionSnapshot } from "../../lib/auth-session-snapshot";

function mockLoginApiResponse(status: number, payload?: unknown): void {
	vi.mocked(api.api.auth.login.post).mockResolvedValueOnce({
		data: status >= 200 && status < 300 ? (payload ?? {}) : null,
		error:
			status >= 200 && status < 300
				? null
				: (payload ?? { error: "Request failed" }),
		status,
		headers: new Headers(),
	} as never);
}

describe("useAuthStore", () => {
	const mockUser: User = {
		id: "user-123",
		email: "test@empresa.com",
		name: "Test User",
		ruc: "20123456789",
		emailVerified: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		role: "ADMIN",
		banned: false,
		banReason: null,
		banExpires: null,
	};
	const mockSession: Session = {
		id: "session-123",
		userId: "user-123",
		expiresAt: new Date("2026-01-31"),
		token: "server-token",
		ipAddress: "127.0.0.1",
		userAgent: "Vitest",
	};

	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();
		vi.mocked(readAuthSessionSnapshot).mockResolvedValue(null);
		vi.mocked(authClient.getSession).mockReset();
		vi.mocked(authClient.getSession).mockResolvedValue({ data: null });
		vi.mocked(api.api.auth.login.post).mockReset();

		// Reset store state
		useAuthStore.setState({
			user: null,
			session: null,
			isAuthenticated: false,
			isLoading: false,
		});
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe("login", () => {
		it("should login successfully with valid credentials", async () => {
			vi.mocked(readAuthSessionSnapshot).mockResolvedValueOnce({
				user: mockUser,
				session: mockSession,
			});
			mockLoginApiResponse(200);

			const { result } = renderHook(() => useAuthStore());

			// Act
			await act(async () => {
				await result.current.login({
					email: "test@empresa.com",
					password: "SecurePass123",
				});
			});

			// Assert
			expect(api.api.auth.login.post).toHaveBeenCalledWith({
				email: "test@empresa.com",
				password: "SecurePass123",
			});

			await waitFor(() => {
				expect(result.current.user).toEqual(mockUser);
				expect(result.current.session).toEqual(mockSession);
				expect(result.current.isAuthenticated).toBe(true);
				expect(result.current.isLoading).toBe(false);
			});
		});

		it("should handle invalid credentials error", async () => {
			mockLoginApiResponse(401, { error: "Credenciales inválidas" });

			const { result } = renderHook(() => useAuthStore());

			// Act & Assert
			await act(async () => {
				await expect(
					result.current.login({
						email: "test@empresa.com",
						password: "wrong-password",
					}),
				).rejects.toThrow("Credenciales inválidas");
			});

			expect(result.current.user).toBeNull();
			expect(result.current.isAuthenticated).toBe(false);
		});

		it("should handle email not verified error", async () => {
			mockLoginApiResponse(401, {
				error: "Por favor verifica tu email antes de iniciar sesión",
			});

			const { result } = renderHook(() => useAuthStore());

			// Act & Assert
			await act(async () => {
				await expect(
					result.current.login({
						email: "test@empresa.com",
						password: "SecurePass123",
					}),
				).rejects.toThrow("verifica tu email");
			});
		});

		it("should handle account banned error", async () => {
			mockLoginApiResponse(403, {
				error: "Tu cuenta ha sido bloqueada. Contacta al administrador.",
			});

			const { result } = renderHook(() => useAuthStore());

			// Act & Assert
			await act(async () => {
				await expect(
					result.current.login({
						email: "test@empresa.com",
						password: "SecurePass123",
					}),
				).rejects.toThrow("bloqueada");
			});
		});

		it("should handle missing user data error", async () => {
			mockLoginApiResponse(200);
			vi.mocked(authClient.getSession).mockResolvedValueOnce({ data: null });

			const { result } = renderHook(() => useAuthStore());

			// Act & Assert
			await act(async () => {
				await expect(
					result.current.login({
						email: "test@empresa.com",
						password: "SecurePass123",
					}),
				).rejects.toThrow("AUTH_SESSION_MISSING");
			});
		});

		it("should set loading state during login", async () => {
			let resolveLogin: (() => void) | null = null;
			const loginPromise = new Promise((resolve) => {
				resolveLogin = () =>
					resolve({
						data: {},
						error: null,
						status: 200,
						headers: new Headers(),
					});
			});
			vi.mocked(api.api.auth.login.post).mockReturnValueOnce(
				loginPromise as never,
			);
			vi.mocked(readAuthSessionSnapshot).mockResolvedValueOnce({
				user: mockUser,
				session: mockSession,
			});

			const { result } = renderHook(() => useAuthStore());

			// Act
			act(() => {
				result.current.login({
					email: "test@empresa.com",
					password: "SecurePass123",
				});
			});

			// Assert - loading state
			await waitFor(() => {
				expect(result.current.isLoading).toBe(true);
			});

			await act(async () => {
				resolveLogin?.();
				await loginPromise;
			});

			// Assert - loading complete
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
		});

		it("should prefer the enriched session snapshot when the wrapper returns company context", async () => {
			const snapshotUser = {
				...mockUser,
				companyId: "cmp-1",
				companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
			};

			mockLoginApiResponse(200);
			vi.mocked(readAuthSessionSnapshot).mockResolvedValueOnce({
				user: snapshotUser,
				session: mockSession,
			});

			const { result } = renderHook(() => useAuthStore());

			await act(async () => {
				await result.current.login({
					email: "test@empresa.com",
					password: "SecurePass123",
				});
			});

			await waitFor(() => {
				expect(result.current.user).toEqual(snapshotUser);
				expect(result.current.session).toMatchObject({ id: "session-123" });
			});
		});

		it("should fall back to Better Auth getSession when the wrapper snapshot is unavailable", async () => {
			const fallbackUser = {
				...mockUser,
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				companyId: "cmp-fallback",
				companyName: "Fallback Company S.A.C.",
			};

			mockLoginApiResponse(200);
			vi.mocked(readAuthSessionSnapshot).mockResolvedValueOnce(null);
			vi.mocked(authClient.getSession).mockResolvedValueOnce({
				data: {
					user: fallbackUser,
				},
			});

			const { result } = renderHook(() => useAuthStore());

			await act(async () => {
				await result.current.login({
					email: "test@empresa.com",
					password: "SecurePass123",
				});
			});

			await waitFor(() => {
				expect(authClient.getSession).toHaveBeenCalled();
				expect(result.current.user).toEqual(fallbackUser);
				expect(result.current.isAuthenticated).toBe(true);
			});
		});
	});

	describe("logout", () => {
		it("should logout successfully and clear state", async () => {
			// Arrange
			const { result } = renderHook(() => useAuthStore());

			// Set initial authenticated state
			act(() => {
				result.current.setSession({
					user: mockUser,
					session: null,
				});
			});

			vi.mocked(authClient.signOut).mockResolvedValueOnce({
				data: {},
				error: null,
			});

			// Act
			await act(async () => {
				await result.current.logout();
			});

			// Assert
			expect(authClient.signOut).toHaveBeenCalled();

			await waitFor(() => {
				expect(result.current.user).toBeNull();
				expect(result.current.session).toBeNull();
				expect(result.current.isAuthenticated).toBe(false);
			});
		});

		it("should clear state even if logout fails", async () => {
			// Arrange
			const { result } = renderHook(() => useAuthStore());

			act(() => {
				result.current.setSession({
					user: mockUser,
					session: null,
				});
			});

			vi.mocked(authClient.signOut).mockRejectedValueOnce(
				new Error("Network error"),
			);

			// Act
			await act(async () => {
				await expect(result.current.logout()).rejects.toThrow("Network error");
			});

			// Assert - state should be cleared regardless of error
			await waitFor(() => {
				expect(result.current.user).toBeNull();
				expect(result.current.isAuthenticated).toBe(false);
			});
		});
	});

	describe("setSession", () => {
		it("should update session and user state", () => {
			// Arrange
			const { result } = renderHook(() => useAuthStore());

			const mockSession = {
				user: mockUser,
				session: {
					id: "session-123",
					userId: "user-123",
					expiresAt: new Date("2026-01-31"),
					token: "mock-token",
				},
			};

			// Act
			act(() => {
				result.current.setSession(mockSession);
			});

			// Assert
			expect(result.current.user).toEqual(mockUser);
			expect(result.current.session).toEqual(mockSession.session);
			expect(result.current.isAuthenticated).toBe(true);
		});

		it("should clear state when session is null", () => {
			// Arrange
			const { result } = renderHook(() => useAuthStore());

			// Set initial state
			act(() => {
				result.current.setSession({
					user: mockUser,
					session: null,
				});
			});

			// Act - clear session
			act(() => {
				result.current.setSession(null);
			});

			// Assert
			expect(result.current.user).toBeNull();
			expect(result.current.session).toBeNull();
			expect(result.current.isAuthenticated).toBe(false);
		});
	});
});
