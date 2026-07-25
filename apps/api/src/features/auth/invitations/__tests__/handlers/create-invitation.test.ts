import { describe, expect, it, vi } from "vitest";

// ============================================================
// Hoisted mocks (must be before any imports that use them)
// ============================================================

const mocks = vi.hoisted(() => {
	const loggerWarn = vi.fn();
	const loggerInfo = vi.fn();

	const resolveSessionIdentity = vi.fn();

	const dbSelect = vi.fn();
	const dbInsert = vi.fn();
	const dbValues = vi.fn();

	return {
		loggerWarn,
		loggerInfo,
		resolveSessionIdentity,
		dbSelect,
		dbInsert,
		dbValues,
	};
});

vi.mock("../../../handlers/session-identity", () => ({
	resolveSessionIdentityFromHeaders:
		mocks.resolveSessionIdentity,
}));

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: mocks.dbSelect,
		insert: mocks.dbInsert,
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

/** Build a chainable mock that returns `result` from the final `.limit()` call. */
function chainableSelectOnce(rows: unknown[]): void {
	function makeThenable(): Promise<unknown[]> & Record<string, () => unknown> {
		const result = {
			limit: () => Promise.resolve(rows),
			innerJoin: () => makeThenable() as unknown,
			where: () => makeThenable() as unknown,
		} as unknown as Promise<unknown[]> & Record<string, () => unknown>;
		(result as unknown as { then: (r: (v: unknown) => void) => void }).then =
			(resolve: (v: unknown) => void) => resolve(rows);
		return result;
	}

	mocks.dbSelect.mockImplementationOnce(() => ({
		from: () => makeThenable(),
	}));
}

/** Mock insert to return rows. */
function chainableInsertOnce(returningRows: unknown[]): void {
	mocks.dbInsert.mockImplementationOnce(() => ({
		values: () => ({
			onConflictDoNothing: async () => undefined,
			returning: async () => returningRows,
		}),
	}));
}

// ============================================================
// Import handler under test AFTER mocks
// ============================================================

import { createInvitation } from "../../application/commands/create-invitation.command";

// ============================================================
// Tests
// ============================================================

describe("createInvitation", () => {
	beforeEach(() => {
		mocks.dbSelect.mockReset();
		mocks.dbInsert.mockReset();
		mocks.resolveSessionIdentity.mockReset();
	});
	it("returns 401 when no session identity", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "",
			legacyUserId: null,
			role: null,
			companyId: null,
			activeCompanyId: null,
			availableCompanyIds: [],
			sessionId: null,
		});

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "test@firm.com", role: "ACCOUNTANT" } },
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
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		// Mock: no membership row → no permission
		chainableSelectOnce([]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "test@firm.com", role: "ACCOUNTANT" } },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Insufficient permissions",
			code: "FORBIDDEN",
		});
	});

	it("returns 422 when inviting with OWNER role", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		// Mock: membership with OWNER role (has user:invite)
		chainableSelectOnce([{ membershipRole: "OWNER" }]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "test@firm.com", role: "OWNER" } },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Cannot invite with OWNER role",
			code: "CANNOT_INVITE_OWNER",
		});
	});

	it("returns 422 when inviting self", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		// Select #1: permission check → OWNER
		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		// Select #2: getSessionEmail → same as invitee email (self-invite!)
		chainableSelectOnce([{ email: "admin@firm.com" }]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "admin@firm.com", role: "ADMIN" } },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Cannot invite yourself",
			code: "CANNOT_INVITE_SELF",
		});
	});

	it("returns 422 when role is invalid", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		chainableSelectOnce([{ membershipRole: "OWNER" }]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "test@firm.com", role: "SUPERHERO" } },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Invalid role",
			code: "INVALID_ROLE",
		});
	});

	it("returns 409 when invitee is already an active member", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		// Select #1: permission check → OWNER
		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		// Select #2: getSessionEmail → inviter email (not matching invitee)
		chainableSelectOnce([{ email: "admin@different.com" }]);
		// Select #3: check existing member → found (returns email from innerJoin)
		chainableSelectOnce([{ email: "existing@firm.com" }]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "existing@firm.com", role: "ACCOUNTANT" } },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "User is already a member of this company",
			code: "ALREADY_MEMBER",
		});
	});

	it("creates invitation successfully (201)", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		const now = new Date();

		// Select #1: permission check → OWNER
		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		// Select #2: getSessionEmail → inviter email (different from invitee)
		chainableSelectOnce([{ email: "admin@firm.com" }]);
		// Select #3: check existing member → none
		chainableSelectOnce([]);
		// Select #4: check existing pending → none
		chainableSelectOnce([]);

		// Insert: return the new invitation
		chainableInsertOnce([
			{
				id: "inv-1",
				companyId: "company-1",
				inviterUserId: "user-1",
				inviteeEmail: "colleague@firm.com",
				role: "ACCOUNTANT",
				token: expect.any(String) as unknown as string,
				status: "pending",
				expiresAt: now, // 7 days later in real code
				createdAt: now,
				updatedAt: now,
			},
		]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "colleague@firm.com", role: "ACCOUNTANT" } },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				invitation: {
					id: "inv-1",
					companyId: "company-1",
					inviteeEmail: "colleague@firm.com",
					role: "ACCOUNTANT",
					status: "pending",
				},
			},
		});
	});

	it("normalizes email on creation", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		chainableSelectOnce([{ email: "admin@firm.com" }]); // getSessionEmail
		chainableSelectOnce([]); // no existing member
		chainableSelectOnce([]); // no existing pending invitation
		chainableInsertOnce([
			{
				id: "inv-1",
				companyId: "company-1",
				inviteeEmail: "colleague@firm.com",
				role: "ACCOUNTANT",
				token: "tok-1",
				status: "pending",
				expiresAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "  COLLEAGUE@Firm.COM  ", role: "ACCOUNTANT" } },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				invitation: {
					inviteeEmail: "colleague@firm.com",
				},
			},
		});
	});

	it("returns 200 with existing invitation when idempotent (duplicate pending)", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		const existingInvitation = {
			id: "existing-inv",
			companyId: "company-1",
			inviterUserId: "user-1",
			inviteeEmail: "colleague@firm.com",
			role: "ACCOUNTANT",
			token: "existing-token",
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Select #1: permission check → OWNER
		chainableSelectOnce([{ membershipRole: "OWNER" }]);
		// Select #2: getSessionEmail → inviter email
		chainableSelectOnce([{ email: "admin@firm.com" }]);
		// Select #3: check existing member → none
		chainableSelectOnce([]);
		// Select #4: check for existing pending invitation
		chainableSelectOnce([existingInvitation]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "colleague@firm.com", role: "ACCOUNTANT" } },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				invitation: expect.objectContaining({
					id: "existing-inv",
					token: "existing-token",
					status: "pending",
				}),
			},
		});
	});

	it("returns 422 when trying to invite with OWNER role", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		chainableSelectOnce([{ membershipRole: "ADMIN" }]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "test@firm.com", role: "OWNER" } },
			ctx(200),
		);

		expect(result.code).toBe("CANNOT_INVITE_OWNER");
	});

	it("returns 422 when role is not a valid MembershipRole", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-1",
			legacyUserId: null,
			role: null,
			companyId: "company-1",
			activeCompanyId: "company-1",
			availableCompanyIds: [],
			sessionId: "session-1",
		});

		chainableSelectOnce([{ membershipRole: "OWNER" }]);

		const result = await createInvitation(
			{ companyId: "company-1", body: { email: "test@firm.com", role: "INVALID_ROLE" } },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVALID_ROLE");
	});
});
