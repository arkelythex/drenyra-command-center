import { describe, expect, it, vi } from "vitest";

// ============================================================
// Hoisted mocks
// ============================================================

const mocks = vi.hoisted(() => {
	const resolveSessionIdentity = vi.fn();
	const dbSelect = vi.fn();

	return { resolveSessionIdentity, dbSelect };
});

vi.mock("../../../handlers/session-identity", () => ({
	resolveSessionIdentityFromHeaders: mocks.resolveSessionIdentity,
}));

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: mocks.dbSelect,
	},
}));

vi.mock("@drenyra/persistence/query", () => {
	const eqFn = vi.fn((col: unknown, val: unknown) => ({ col, val, _op: "eq" }));
	const andFn = vi.fn((...conditions: unknown[]) => ({ conditions, _op: "and" }));
	return { eq: eqFn, and: andFn };
});

vi.mock("@drenyra/persistence/schema", () => ({
	authInvitations: {
		id: "id",
		companyId: "company_id",
		inviteeEmail: "invitee_email",
		role: "role",
		status: "status",
		expiresAt: "expires_at",
		createdAt: "created_at",
		updatedAt: "updated_at",
		token: "token",
	},
	authUserCompanies: {
		id: "id",
		userId: "user_id",
		companyId: "company_id",
		membershipRole: "membership_role",
		isDefault: "is_default",
		membershipStatus: "membership_status",
	},
}));

vi.mock("../../../../../lib/logger", () => ({
	createLogger: vi.fn(() => ({ warn: vi.fn(), info: vi.fn() })),
}));

// ============================================================
// Helpers
// ============================================================

type ElysiaContext = {
	set: { status: number };
	headers: Record<string, string>;
};

function ctx(status: number, headers?: Record<string, string>): ElysiaContext {
	return { set: { status }, headers: headers ?? {} };
}

function chainableSelectOnce(rows: unknown[]): void {
	const queryResult = {
		limit: () => Promise.resolve(rows),
		orderBy: () => Promise.resolve(rows),
		then: (resolve: (v: unknown) => void) => resolve(rows),
	} as Promise<unknown[]> & { limit: () => Promise<unknown[]>; orderBy: () => Promise<unknown[]> };
	mocks.dbSelect.mockImplementationOnce(() => ({
		from: () => ({
			where: () => queryResult,
		}),
	}));
}

// ============================================================
// Import handler after mocks
// ============================================================

import { listInvitations } from "../../application/queries/list-invitations.query";

// ============================================================
// Tests
// ============================================================

describe("listInvitations", () => {
	it("returns 401 when no session identity", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "",
		} as never);

		const result = await listInvitations(
			{ companyId: "company-1" },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Authentication required",
			code: "AUTH_REQUIRED",
		});
	});

	it("returns 403 when user lacks user:invite permission", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		chainableSelectOnce([]);

		const result = await listInvitations(
			{ companyId: "company-1" },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Insufficient permissions",
			code: "FORBIDDEN",
		});
	});

	it("returns empty list when no pending invitations", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		// Permission check
		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		// Invitations list
		chainableSelectOnce([]);

		const result = await listInvitations(
			{ companyId: "company-1" },
			ctx(200),
		);

		expect(result).toEqual({
			success: true,
			data: { invitations: [] },
		});
	});

	it("returns pending invitations only (no tokens)", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		chainableSelectOnce([{ membershipRole: "OWNER" }]);

		const invitations = [
			{
				id: "inv-1",
				companyId: "company-1",
				inviteeEmail: "a@firm.com",
				role: "ACCOUNTANT",
				status: "pending",
				expiresAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				token: "tok-1",
			},
			{
				id: "inv-2",
				companyId: "company-1",
				inviteeEmail: "b@firm.com",
				role: "REVIEWER",
				status: "pending",
				expiresAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				token: "tok-2",
			},
		];

		chainableSelectOnce(invitations);

		const result = await listInvitations(
			{ companyId: "company-1" },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				invitations: [
					{
						id: "inv-1",
						inviteeEmail: "a@firm.com",
						role: "ACCOUNTANT",
						status: "pending",
					},
					{
						id: "inv-2",
						inviteeEmail: "b@firm.com",
						role: "REVIEWER",
						status: "pending",
					},
				],
			},
		});

		// Verify tokens are NOT included
		const data = result.data as { invitations: Array<Record<string, unknown>> };
		for (const inv of data.invitations) {
			expect(inv).not.toHaveProperty("token");
		}
	});

	it("returns 403 for VIEWER role", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		chainableSelectOnce([{ membershipRole: "VIEWER" }]);

		const result = await listInvitations(
			{ companyId: "company-1" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("FORBIDDEN");
	});
});
