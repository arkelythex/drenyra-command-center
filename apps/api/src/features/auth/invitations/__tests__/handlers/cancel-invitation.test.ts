import { describe, expect, it, vi } from "vitest";

// ============================================================
// Hoisted mocks
// ============================================================

const mocks = vi.hoisted(() => {
	const resolveSessionIdentity = vi.fn();
	const dbSelect = vi.fn();
	const dbUpdate = vi.fn();

	return { resolveSessionIdentity, dbSelect, dbUpdate };
});

vi.mock("../../../handlers/session-identity", () => ({
	resolveSessionIdentityFromHeaders: mocks.resolveSessionIdentity,
}));

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: mocks.dbSelect,
		update: mocks.dbUpdate,
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
		status: "status",
		updatedAt: "updated_at",
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
	mocks.dbSelect.mockImplementationOnce(() => ({
		from: () => ({
			where: () => ({
				limit: async () => rows,
			}),
		}),
	}));
}

function chainableUpdateOnce(): void {
	mocks.dbUpdate.mockImplementationOnce(() => ({
		set: () => ({
			where: async () => undefined,
		}),
	}));
}

// ============================================================
// Import handler after mocks
// ============================================================

import { cancelInvitation } from "../../application/commands/cancel-invitation.command";

// ============================================================
// Tests
// ============================================================

describe("cancelInvitation", () => {
	it("returns 401 when no session identity", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "",
		} as never);

		const result = await cancelInvitation(
			{ companyId: "company-1", invitationId: "inv-1" },
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

		// No membership returned
		chainableSelectOnce([]);

		const result = await cancelInvitation(
			{ companyId: "company-1", invitationId: "inv-1" },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Insufficient permissions",
			code: "FORBIDDEN",
		});
	});

	it("removes pending invitation successfully", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		// Permission check → OWNER
		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		// Find invitation
		chainableSelectOnce([{ id: "inv-1", companyId: "company-1", status: "pending" }]);
		// Update
		chainableUpdateOnce();

		const result = await cancelInvitation(
			{ companyId: "company-1", invitationId: "inv-1" },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				invitation: expect.objectContaining({
					id: "inv-1",
					status: "cancelled",
				}),
			},
		});
	});

	it("returns 409 when invitation is not pending", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		chainableSelectOnce([{ id: "inv-1", companyId: "company-1", status: "accepted" }]);

		const result = await cancelInvitation(
			{ companyId: "company-1", invitationId: "inv-1" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_PENDING");
	});

	it("returns 404 for cross-company access (invitation not found for that company)", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		// Invitation exists but belongs to a different company
		chainableSelectOnce([]);

		const result = await cancelInvitation(
			{ companyId: "company-2", invitationId: "inv-1" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_FOUND");
	});

	it("returns 404 when invitation does not exist", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
		} as never);

		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		chainableSelectOnce([]);

		const result = await cancelInvitation(
			{ companyId: "company-1", invitationId: "nonexistent" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_FOUND");
	});
});
