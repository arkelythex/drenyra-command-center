/**
 * Company Scope Guard — Unit Tests
 *
 * Tests for the Elysia plugin that wraps resolveSessionContext and
 * injects companyContext into the request store via .derive().
 *
 * Covers:
 * - Happy path: companyContext injected with correct fields
 * - allowHeaderFallback: true passes through (no error)
 * - allowHeaderFallback: false fails closed with 401
 * - resolveSessionContext failure propagation
 */

import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { companyScopeGuard } from "../company-scope-guard";

// Mock resolveSessionContext
vi.mock("../../../features/security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../features/security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

function createTestApp(options?: { allowHeaderFallback?: boolean }) {
	const app = new Elysia()
		.use(companyScopeGuard(options ?? {}))
		.get("/test", ({ companyContext }: { companyContext?: unknown }) => {
			return { companyContext: companyContext ?? null };
		});

	return app;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("companyScopeGuard", () => {
	describe("happy path — session context available", () => {
		it("injects companyContext with all required fields", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: true,
				context: {
					userId: "usr_123",
					authUserId: "usr_123",
					legacyUserId: "legacy_456",
					role: "admin",
					companyId: "cmp_789",
				},
			});

			const app = createTestApp({ allowHeaderFallback: true });
			const response = await app.handle(
				new Request("http://localhost/test", {
					headers: { "x-company-id": "cmp_789" },
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.companyContext).toEqual({
				userId: "usr_123",
				authUserId: "usr_123",
				legacyUserId: "legacy_456",
				role: "admin",
				companyId: "cmp_789",
			});
		});

		it("accepts legacyUserId as null", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: true,
				context: {
					userId: "usr_1",
					authUserId: "usr_1",
					legacyUserId: null,
					role: "user",
					companyId: "cmp_1",
				},
			});

			const app = createTestApp({ allowHeaderFallback: true });
			const response = await app.handle(
				new Request("http://localhost/test", {
					headers: { "x-company-id": "cmp_1" },
				}),
			);

			const body = await response.json();
			expect(body.companyContext.legacyUserId).toBeNull();
			expect(body.companyContext.companyId).toBe("cmp_1");
		});
	});

	describe("allowHeaderFallback: true — backward compatible", () => {
		it("passes through when session context cannot be resolved", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: false,
				status: 401,
				code: "SESSION_REQUIRED",
				error: "Se requiere sesión activa",
			});

			const app = createTestApp({ allowHeaderFallback: true });
			const response = await app.handle(new Request("http://localhost/test"));

			// In fallback mode, no company context is injected but the handler
			// still runs — backward compatible
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.companyContext).toBeNull();
		});

		it("logs but allows request when resolveSessionContext fails", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: false,
				status: 403,
				code: "TENANT_REQUIRED",
				error: "X-Company-Id header is required",
			});

			const app = createTestApp({ allowHeaderFallback: true });
			const response = await app.handle(new Request("http://localhost/test"));

			// Even with 403 from resolveSessionContext, fallback allows pass-through
			expect(response.status).toBe(200);
		});
	});

	describe("allowHeaderFallback: false — fail closed", () => {
		it("rejects request with 401 when session context fails", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: false,
				status: 401,
				code: "SESSION_REQUIRED",
				error: "Se requiere sesión activa",
			});

			const app = createTestApp({ allowHeaderFallback: false });
			const response = await app.handle(new Request("http://localhost/test"));

			expect(response.status).toBe(401);
		});

		it("rejects request with 403 when tenant scope is required", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: false,
				status: 403,
				code: "TENANT_REQUIRED",
				error: "X-Company-Id header is required",
			});

			const app = createTestApp({ allowHeaderFallback: false });
			const response = await app.handle(new Request("http://localhost/test"));

			expect(response.status).toBe(403);
		});
	});

	describe("default behavior (allowHeaderFallback not set)", () => {
		it("defaults to fail-closed (allowHeaderFallback: false)", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: false,
				status: 401,
				code: "SESSION_REQUIRED",
				error: "Se requiere sesión activa",
			});

			const app = createTestApp(); // no options
			const response = await app.handle(new Request("http://localhost/test"));

			expect(response.status).toBe(401);
		});
	});

	describe("resolveSessionContext integration", () => {
		it("passes headers to resolveSessionContext", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: true,
				context: {
					userId: "usr_1",
					authUserId: "usr_1",
					legacyUserId: null,
					role: "admin",
					companyId: "cmp_1",
				},
			});

			const app = createTestApp({ allowHeaderFallback: true });
			await app.handle(
				new Request("http://localhost/test", {
					headers: {
						"x-company-id": "cmp_1",
						authorization: "Bearer test-token",
					},
				}),
			);

			// Verify headers were passed through
			const callArgs = mockResolve.mock.calls[0][0];
			expect(callArgs.headers).toBeDefined();
			expect(callArgs.requireSession).toBe(false);
			expect(callArgs.allowHeaderFallback).toBe(true);
		});

		it("sets requireSession=true when allowHeaderFallback is false", async () => {
			mockResolve.mockResolvedValueOnce({
				ok: true,
				context: {
					userId: "usr_1",
					authUserId: "usr_1",
					legacyUserId: null,
					role: "admin",
					companyId: "cmp_1",
				},
			});

			const app = createTestApp({ allowHeaderFallback: false });
			await app.handle(new Request("http://localhost/test"));

			const callArgs = mockResolve.mock.calls[0][0];
			expect(callArgs.requireSession).toBe(true);
		});
	});
});
