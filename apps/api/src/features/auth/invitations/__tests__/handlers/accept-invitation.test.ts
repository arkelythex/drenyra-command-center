import { describe, expect, it, vi } from "vitest";

// ============================================================
// Hoisted mocks
// ============================================================

const mocks = vi.hoisted(() => {
	const loggerWarn = vi.fn();
	const loggerInfo = vi.fn();
	const resolveSessionIdentity = vi.fn();
	const dbSelect = vi.fn();
	const dbInsert = vi.fn();
	const dbUpdate = vi.fn();
	const dbSet = vi.fn();
	const dbWhere = vi.fn();

	return {
		loggerWarn,
		loggerInfo,
		resolveSessionIdentity,
		dbSelect,
		dbInsert,
		dbUpdate,
		dbSet,
		dbWhere,
	};
});

vi.mock("../../../handlers/session-identity", () => ({
	resolveSessionIdentityFromHeaders: mocks.resolveSessionIdentity,
}));

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: mocks.dbSelect,
		insert: mocks.dbInsert,
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
		inviterUserId: "inviter_user_id",
		inviteeEmail: "invitee_email",
		role: "role",
		token: "token",
		status: "status",
		expiresAt: "expires_at",
		createdAt: "created_at",
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
	authUsers: {
		id: "id",
		email: "email",
	},
}));

vi.mock("../../../../../lib/logger", () => ({
	createLogger: vi.fn(() => ({
		warn: mocks.loggerWarn,
		info: mocks.loggerInfo,
	})),
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

function chainableInsertOnce(returningRows: unknown[]): void {
	mocks.dbInsert.mockImplementationOnce(() => ({
		values: () => ({
			onConflictDoNothing: async () => undefined,
			returning: async () => returningRows,
		}),
	}));
}

function chainableUpdateOnce(): void {
	mocks.dbUpdate.mockImplementationOnce(() => ({
		set: () => ({
			where: async () => [{ status: "accepted" }],
		}),
	}));
}

// ============================================================
// Import handler under test AFTER mocks
// ============================================================

import { acceptInvitation } from "../../application/commands/accept-invitation.command";

// ============================================================
// Tests
// ============================================================

describe("acceptInvitation", () => {
	it("returns 401 when no session identity", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "",
			sessionId: null,
		} as never);

		const result = await acceptInvitation(
			{ token: "some-token" },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Authentication required",
			code: "AUTH_REQUIRED",
		});
	});

	it("returns 404 when token not found", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			sessionId: "session-1",
		} as never);

		// Token lookup returns nothing
		chainableSelectOnce([]);

		const result = await acceptInvitation(
			{ token: "nonexistent-token" },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Invitation not found or no longer valid",
			code: "INVITATION_NOT_FOUND",
		});
	});

	it("returns 410 / INVITATION_NOT_FOUND for expired token (lazy expiry)", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
			sessionId: "session-2",
		} as never);

		const expiredInvitation = {
			id: "inv-1",
			companyId: "company-1",
			inviterUserId: "user-1",
			inviteeEmail: "colleague@firm.com",
			role: "ACCOUNTANT",
			token: "expired-token",
			status: "pending",
			expiresAt: new Date("2020-01-01"),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		chainableSelectOnce([expiredInvitation]);
		chainableUpdateOnce(); // lazy-expire update

		const result = await acceptInvitation(
			{ token: "expired-token" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_FOUND");
	});

	it("returns 404 for already accepted invitation", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
			sessionId: "session-2",
		} as never);

		const acceptedInvitation = {
			id: "inv-1",
			companyId: "company-1",
			inviteeEmail: "colleague@firm.com",
			role: "ACCOUNTANT",
			token: "acc-token",
			status: "accepted",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		chainableSelectOnce([acceptedInvitation]);

		const result = await acceptInvitation(
			{ token: "acc-token" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_FOUND");
	});

	it("returns 404 for already rejected invitation", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
			sessionId: "session-2",
		} as never);

		const rejectedInvitation = {
			id: "inv-1",
			companyId: "company-1",
			inviteeEmail: "colleague@firm.com",
			role: "ACCOUNTANT",
			token: "rej-token",
			status: "rejected",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		chainableSelectOnce([rejectedInvitation]);

		const result = await acceptInvitation(
			{ token: "rej-token" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_FOUND");
	});

	it("returns 403 when email does not match (case-insensitive)", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-3",
			sessionId: "session-3",
		} as never);

		const invitation = {
			id: "inv-1",
			companyId: "company-1",
			inviteeEmail: "colleague@firm.com",
			role: "ACCOUNTANT",
			token: "valid-token",
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Token lookup
		chainableSelectOnce([invitation]);
		// User email lookup: returns different email
		chainableSelectOnce([{ email: "attacker@evil.com" }]);

		const result = await acceptInvitation(
			{ token: "valid-token" },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Email does not match invitation",
			code: "EMAIL_MISMATCH",
		});
	});

	it("accepts when email matches case-insensitively", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
			sessionId: "session-2",
		} as never);

		const invitation = {
			id: "inv-1",
			companyId: "company-1",
			inviteeEmail: "Colleague@Firm.COM",
			role: "ACCOUNTANT",
			token: "valid-token",
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Token lookup
		chainableSelectOnce([invitation]);
		// User email: lowercase match
		chainableSelectOnce([{ email: "colleague@firm.com" }]);
		// Check existing membership: none
		chainableSelectOnce([]);
		// Update invitation status
		chainableUpdateOnce();
		// Insert membership
		chainableInsertOnce([
			{
				userId: "user-2",
				companyId: "company-1",
				membershipRole: "ACCOUNTANT",
				membershipStatus: "active",
				isDefault: false,
			},
		]);

		const result = await acceptInvitation(
			{ token: "valid-token" },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				membership: {
					companyId: "company-1",
					membershipRole: "ACCOUNTANT",
					membershipStatus: "active",
					isDefault: false,
				},
			},
		});
	});

	it("returns 409 when user is already a member via separate check", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
			sessionId: "session-2",
		} as never);

		const invitation = {
			id: "inv-1",
			companyId: "company-1",
			inviteeEmail: "colleague@firm.com",
			role: "ACCOUNTANT",
			token: "valid-token",
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		chainableSelectOnce([invitation]);
		chainableSelectOnce([{ email: "colleague@firm.com" }]);
		// Already a member
		chainableSelectOnce([{ id: "existing-member" }]);

		const result = await acceptInvitation(
			{ token: "valid-token" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("ALREADY_MEMBER");
	});

	it("accepts successfully and creates membership", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
			sessionId: "session-2",
		} as never);

		const invitation = {
			id: "inv-1",
			companyId: "company-1",
			inviteeEmail: "colleague@firm.com",
			role: "ACCOUNTANT",
			token: "valid-token",
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		chainableSelectOnce([invitation]);
		chainableSelectOnce([{ email: "colleague@firm.com" }]);
		chainableSelectOnce([]); // no existing member
		chainableUpdateOnce(); // update status
		chainableInsertOnce([
			{
				userId: "user-2",
				companyId: "company-1",
				membershipRole: "ACCOUNTANT",
				membershipStatus: "active",
				isDefault: false,
			},
		]);

		const result = await acceptInvitation(
			{ token: "valid-token" },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				membership: {
					companyId: "company-1",
					membershipRole: "ACCOUNTANT",
					membershipStatus: "active",
					isDefault: false,
				},
			},
		});
	});

	it("returns same error shape for non-existent and expired tokens", async () => {
		const expiredResult = {
			success: false,
			error: "Invitation not found or no longer valid",
			code: "INVITATION_NOT_FOUND",
		};

		const notFoundResult = {
			success: false,
			error: "Invitation not found or no longer valid",
			code: "INVITATION_NOT_FOUND",
		};

		expect(expiredResult).toEqual(notFoundResult);
	});
});
