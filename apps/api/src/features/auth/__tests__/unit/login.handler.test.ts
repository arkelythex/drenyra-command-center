import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "elysia";
import { fingerprintSensitiveValue } from "../../lib/auth-event-sanitizer";

interface AuthUserRow {
	userId: string;
	failedLoginAttempts: number;
	lockedUntil: Date | null;
}

const mocks = vi.hoisted(() => {
	const loggerWarn = vi.fn();
	const loggerInfo = vi.fn();
	const loggerError = vi.fn();

	const authHandler = vi.fn();
	const dbSelect = vi.fn();
	const dbUpdate = vi.fn();
	const dbSet = vi.fn();
	const dbWhere = vi.fn();
	const eq = vi.fn();

	return {
		loggerWarn,
		loggerInfo,
		loggerError,
		authHandler,
		dbSelect,
		dbUpdate,
		dbSet,
		dbWhere,
		eq,
	};
});

vi.mock("../../auth.config", () => ({
	auth: {
		handler: mocks.authHandler,
	},
}));

vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		select: mocks.dbSelect,
		update: mocks.dbUpdate,
	},
}));

vi.mock("@arkelythex/persistence/query", () => ({
	eq: mocks.eq,
}));

vi.mock("@arkelythex/persistence/schema", () => ({
	authUsers: {
		id: "id",
		email: "email",
		failedLoginAttempts: "failed_login_attempts",
		lockedUntil: "locked_until",
	},
}));

vi.mock("../../../../lib/logger", () => ({
	createLogger: vi.fn(() => ({
		warn: mocks.loggerWarn,
		info: mocks.loggerInfo,
		error: mocks.loggerError,
	})),
}));

import { handleLogin } from "../../handlers/login.handler";

function mockSelectResultOnce(rows: AuthUserRow[]): void {
	mocks.dbSelect.mockImplementationOnce(() => ({
		from: () => ({
			where: () => ({
				limit: async () => rows,
			}),
		}),
	}));
}

function buildContext(ipAddress = "198.51.100.10"): Context {
	const request = new Request("http://localhost:3000/api/login", {
		headers: {
			"x-forwarded-for": ipAddress,
		},
	});

	return {
		set: { status: 200 },
		headers: {},
		request,
	} as unknown as Context;
}

describe("handleLogin durable lockout runtime behavior", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mocks.eq.mockImplementation((left: unknown, right: unknown) => ({
			left,
			right,
		}));
		mocks.dbUpdate.mockImplementation(() => ({
			set: mocks.dbSet,
		}));
		mocks.dbSet.mockImplementation((_values: unknown) => ({
			where: mocks.dbWhere,
		}));
		mocks.dbWhere.mockResolvedValue(undefined);
	});

	it("increments failed_login_attempts and logs sanitized auth event payload on failed login", async () => {
		const email = "qa.operator@arkelythexfounders.com";
		const ipAddress = "198.51.100.45";

		mockSelectResultOnce([
			{
				userId: "user-1",
				failedLoginAttempts: 0,
				lockedUntil: null,
			},
		]);
		mockSelectResultOnce([
			{
				userId: "user-1",
				failedLoginAttempts: 0,
				lockedUntil: null,
			},
		]);

		mocks.authHandler.mockResolvedValue(
			new Response(
				JSON.stringify({ error: { message: "Invalid credentials" } }),
				{
					status: 401,
				},
			),
		);

		const context = buildContext(ipAddress);
		const result = await handleLogin(
			{ email, password: "wrong-password" },
			context,
		);

		expect(mocks.dbUpdate).toHaveBeenCalledTimes(1);
		expect(mocks.dbSet).toHaveBeenCalledWith(
			expect.objectContaining({
				failedLoginAttempts: 1,
				lockedUntil: null,
			}),
		);

		expect(result).toEqual(
			expect.objectContaining({
				success: false,
				code: "AUTH_ERROR",
				error: "Credenciales inválidas",
			}),
		);

		expect(mocks.loggerWarn).toHaveBeenCalledWith(
			expect.objectContaining({
				emailHash: fingerprintSensitiveValue(email),
				ipHash: fingerprintSensitiveValue(ipAddress),
				locked: false,
			}),
			"Login failed",
		);

		const [eventPayload] = mocks.loggerWarn.mock.calls[0] as [
			Record<string, unknown>,
			string,
		];
		expect(eventPayload.email).toBeUndefined();
		expect(eventPayload.ip).toBeUndefined();
		expect(eventPayload.ipAddress).toBeUndefined();
		expect(eventPayload.ruc).toBeUndefined();
		expect(Object.values(eventPayload)).not.toContain(email);
		expect(Object.values(eventPayload)).not.toContain(ipAddress);
	});

	it("resets failed_login_attempts and locked_until after successful login", async () => {
		const email = "security.lead@arkelythexfounders.com";

		mockSelectResultOnce([
			{
				userId: "user-2",
				failedLoginAttempts: 4,
				lockedUntil: null,
			},
		]);

		mocks.authHandler.mockResolvedValue(
			new Response(JSON.stringify({ token: "session-token" }), { status: 200 }),
		);

		const context = buildContext();
		await handleLogin({ email, password: "correct-password" }, context);

		expect(mocks.dbSet).toHaveBeenCalledWith(
			expect.objectContaining({
				failedLoginAttempts: 0,
				lockedUntil: null,
			}),
		);
		expect(mocks.loggerInfo).toHaveBeenCalledWith(
			expect.objectContaining({
				emailHash: fingerprintSensitiveValue(email),
			}),
			"Login succeeded",
		);
	});

	it("enforces locked_until and blocks authentication before calling BetterAuth", async () => {
		const email = "blocked.user@arkelythexfounders.com";
		const ipAddress = "203.0.113.23";
		const lockUntil = new Date(Date.now() + 10 * 60 * 1000);

		mockSelectResultOnce([
			{
				userId: "user-3",
				failedLoginAttempts: 5,
				lockedUntil: lockUntil,
			},
		]);

		const context = buildContext(ipAddress);
		const result = await handleLogin(
			{ email, password: "any-password" },
			context,
		);

		expect(mocks.authHandler).not.toHaveBeenCalled();
		expect((context as unknown as { set: { status: number } }).set.status).toBe(
			429,
		);
		expect(result).toEqual(
			expect.objectContaining({
				success: false,
				code: "ACCOUNT_LOCKED",
			}),
		);

		expect(mocks.loggerWarn).toHaveBeenCalledWith(
			expect.objectContaining({
				emailHash: fingerprintSensitiveValue(email),
				ipHash: fingerprintSensitiveValue(ipAddress),
				lockedUntil: lockUntil,
			}),
			"Login blocked by account lockout",
		);

		const [eventPayload] = mocks.loggerWarn.mock.calls[0] as [
			Record<string, unknown>,
			string,
		];
		expect(eventPayload.email).toBeUndefined();
		expect(eventPayload.ipAddress).toBeUndefined();
		expect(eventPayload.ruc).toBeUndefined();
		expect(Object.values(eventPayload)).not.toContain(email);
		expect(Object.values(eventPayload)).not.toContain(ipAddress);
	});
});
