import { describe, expect, it, vi } from "vitest";

// ============================================================
// Hoisted mocks
// ============================================================

const mocks = vi.hoisted(() => {
	const loggerWarn = vi.fn();
	const loggerInfo = vi.fn();
	const resolveSessionIdentity = vi.fn();
	const dbSelect = vi.fn();
	const dbUpdate = vi.fn();

	return {
		loggerWarn,
		loggerInfo,
		resolveSessionIdentity,
		dbSelect,
		dbUpdate,
	};
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
		token: "token",
		status: "status",
		inviteeEmail: "invitee_email",
		expiresAt: "expires_at",
		updatedAt: "updated_at",
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

import { rejectInvitation } from "../../application/commands/reject-invitation.command";

// ============================================================
// Tests
// ============================================================

describe("rejectInvitation", () => {
	it("returns 401 when no session identity", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "",
		} as never);

		const result = await rejectInvitation(
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
		} as never);

		chainableSelectOnce([]);

		const result = await rejectInvitation(
			{ token: "bad-token" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_FOUND");
	});

	it("rejects successfully", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
		} as never);

		const invitation = {
			id: "inv-1",
			inviteeEmail: "colleague@firm.com",
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		};

		chainableSelectOnce([invitation]);
		// User email lookup
		chainableSelectOnce([{ email: "colleague@firm.com" }]);
		chainableUpdateOnce();

		const result = await rejectInvitation(
			{ token: "valid-token" },
			ctx(200),
		);

		expect(result).toMatchObject({
			success: true,
			data: {
				invitation: {
					id: "inv-1",
					status: "rejected",
				},
			},
		});
	});

	it("returns 410 for expired token", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
		} as never);

		const invitation = {
			id: "inv-1",
			inviteeEmail: "colleague@firm.com",
			status: "pending",
			expiresAt: new Date("2020-01-01"),
		};

		chainableSelectOnce([invitation]);
		chainableUpdateOnce(); // lazy-expire update

		const result = await rejectInvitation(
			{ token: "expired-token" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_NOT_FOUND");
	});

	it("returns 403 for email mismatch", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-3",
		} as never);

		const invitation = {
			id: "inv-1",
			inviteeEmail: "colleague@firm.com",
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		};

		chainableSelectOnce([invitation]);
		chainableSelectOnce([{ email: "other@firm.com" }]);

		const result = await rejectInvitation(
			{ token: "valid-token" },
			ctx(200),
		);

		expect(result).toEqual({
			success: false,
			error: "Email does not match invitation",
			code: "EMAIL_MISMATCH",
		});
	});

	it("returns 409 for already accepted invitation", async () => {
		mocks.resolveSessionIdentity.mockResolvedValueOnce({
			authUserId: "user-2",
		} as never);

		const invitation = {
			id: "inv-1",
			inviteeEmail: "colleague@firm.com",
			status: "accepted",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		};

		chainableSelectOnce([invitation]);

		const result = await rejectInvitation(
			{ token: "acc-token" },
			ctx(200),
		);

		expect(result.success).toBe(false);
		expect(result.code).toBe("INVITATION_ALREADY_ACCEPTED");
	});
});
