/**
 * Permission Guard — Unit Tests
 *
 * Tests for the Elysia plugin that checks role-based permissions
 * via companyContext.role against the requirePermission guard.
 *
 * Covers:
 * - Happy path: role has required permission
 * - Missing permission: returns 403
 * - No companyContext (unauthenticated): returns 401
 * - Multiple permissions: ANY match grants access
 * - Role hierarchy: senior can do what junior can do (when permitted)
 */

import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import type { CompanyContext } from "../company-scope-guard";
import { requirePermission } from "../permission-guard";

/**
 * Creates a test app with the companyScopeGuard already resolved.
 * This bypasses session resolution and injects a mock companyContext
 * so we can test the permission guard in isolation.
 */
function createTestApp(
	mockContext: CompanyContext | null,
	permission: Parameters<typeof requirePermission>[0],
) {
	const app = new Elysia()
		// Simulate what companyScopeGuard does — inject companyContext via derive
		.derive(() => ({
			companyContext: mockContext,
		}))
		.use(requirePermission(permission))
		.get("/test", () => ({ success: true, data: "ok" }));

	return app;
}

describe("requirePermission", () => {
	describe("happy path — role has permission", () => {
		it("allows request when owner role has the required permission", async () => {
			const app = createTestApp(
				{
					userId: "usr_1",
					authUserId: "usr_1",
					legacyUserId: null,
					role: "owner",
					companyId: "cmp_1",
				},
				"journal:create",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
		});

		it("allows request when senior role has the required permission", async () => {
			const app = createTestApp(
				{
					userId: "usr_2",
					authUserId: "usr_2",
					legacyUserId: null,
					role: "senior",
					companyId: "cmp_1",
				},
				"journal:read",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(200);
		});

		it("allows request when junior role has the required permission", async () => {
			const app = createTestApp(
				{
					userId: "usr_3",
					authUserId: "usr_3",
					legacyUserId: null,
					role: "junior",
					companyId: "cmp_1",
				},
				"sunat:read",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(200);
		});

		it("allows request when client role has the required permission", async () => {
			const app = createTestApp(
				{
					userId: "usr_4",
					authUserId: "usr_4",
					legacyUserId: null,
					role: "client",
					companyId: "cmp_1",
				},
				"reports:read_basic",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(200);
		});
	});

	describe("permission denied — returns 403", () => {
		it("rejects when junior tries owner-only action", async () => {
			const app = createTestApp(
				{
					userId: "usr_3",
					authUserId: "usr_3",
					legacyUserId: null,
					role: "junior",
					companyId: "cmp_1",
				},
				"company:delete",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.code).toBe("FORBIDDEN");
			expect(body.userRole).toBe("junior");
		});

		it("rejects when client tries accounting action", async () => {
			const app = createTestApp(
				{
					userId: "usr_4",
					authUserId: "usr_4",
					legacyUserId: null,
					role: "client",
					companyId: "cmp_1",
				},
				"accounting:close",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(403);
		});

		it("returns the list of required permissions in error body", async () => {
			const app = createTestApp(
				{
					userId: "usr_4",
					authUserId: "usr_4",
					legacyUserId: null,
					role: "client",
					companyId: "cmp_1",
				},
				"audit:read",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			const body = await response.json();
			expect(body.requiredPermissions).toContain("audit:read");
		});
	});

	describe("unauthenticated — returns 401", () => {
		it("rejects when no companyContext is present", async () => {
			const app = createTestApp(null, "journal:read");

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.code).toBe("SESSION_REQUIRED");
		});
	});

	describe("multiple permissions — ANY match", () => {
		it("allows if role matches at least one permission", async () => {
			const app = createTestApp(
				{
					userId: "usr_3",
					authUserId: "usr_3",
					legacyUserId: null,
					role: "junior",
					companyId: "cmp_1",
				},
				["audit:read", "reports:read_operational"],
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(200);
		});

		it("rejects if role matches no permission in the list", async () => {
			const app = createTestApp(
				{
					userId: "usr_4",
					authUserId: "usr_4",
					legacyUserId: null,
					role: "client",
					companyId: "cmp_1",
				},
				["accounting:close", "audit:read"],
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(403);
		});
	});

	describe("role boundary edge cases", () => {
		it("owner has all permissions", async () => {
			const allPermissions: Parameters<typeof requirePermission>[0][] = [
				"company:create",
				"company:delete",
				"company:update",
				"company:read",
				"journal:read",
				"journal:create",
				"journal:update",
				"journal:delete",
				"sunat:declare",
				"sunat:read",
				"accounting:close",
				"accounting:open",
				"reports:read_all",
				"reports:read_basic",
				"payroll:read",
				"payroll:manage",
				"users:create_staff",
				"users:invite_team",
				"users:read",
				"audit:read",
			];

			for (const perm of allPermissions) {
				const app = createTestApp(
					{
						userId: "usr_owner",
						authUserId: "usr_owner",
						legacyUserId: null,
						role: "owner",
						companyId: "cmp_1",
					},
					perm as string,
				);

				const response = await app.handle(new Request("http://localhost/test"));
				expect(response.status).toBe(200);
			}
		});

		it("client has minimum permissions", async () => {
			const app = createTestApp(
				{
					userId: "usr_client",
					authUserId: "usr_client",
					legacyUserId: null,
					role: "client",
					companyId: "cmp_1",
				},
				"company:read",
			);

			const response = await app.handle(new Request("http://localhost/test"));
			expect(response.status).toBe(200);
		});
	});
});
