import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../auth/auth.config";
import { resolveSessionContext } from "../session-context";
import { createHmac } from "node:crypto";

describe("session-context", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = {
			...originalEnv,
			NODE_ENV: "test",
			SECURITY_ENFORCE_TEST_SESSION: "true",
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("requires active session when enforcement is enabled", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const result = await resolveSessionContext({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-auth-user-id": "usr-1",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
		});

		expect(result).toMatchObject({
			ok: false,
			status: 401,
			code: "SESSION_REQUIRED",
		});
	});

	it("rejects user mismatch between session and header", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: { id: "usr-session" },
		} as never);

		const result = await resolveSessionContext({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-auth-user-id": "usr-header",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_MISMATCH",
		});
	});

	it("enforces tenant binding when requestedCompanyId is provided", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: { id: "usr-1" },
		} as never);

		const result = await resolveSessionContext({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-auth-user-id": "usr-1",
				"x-user-role": "admin",
				"x-company-id": "cmp-tenant-A",
			},
			requestedCompanyId: "cmp-tenant-B",
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "TENANT_SCOPE_VIOLATION",
		});
	});

	it("accepts x-active-company-id as the active tenant header", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: {
				id: "usr-1",
				role: "admin",
				activeCompanyId: "cmp-active-1",
			},
		} as never);

		const result = await resolveSessionContext({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-auth-user-id": "usr-1",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-active-company-id": "cmp-active-1",
			},
			requestedCompanyId: "cmp-active-1",
		});

		expect(result).toEqual({
			ok: true,
			context: {
				userId: "usr-1",
				authUserId: "usr-1",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp-active-1",
			},
		});
	});

	it("hydrates authUserId from Better Auth session when only legacy header is provided", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: {
				id: "auth-user-42",
				role: "admin",
				activeCompanyId: "cmp-1",
			},
		} as never);

		const result = await resolveSessionContext({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
		});

		expect(result).toEqual({
			ok: true,
			context: {
				userId: "auth-user-42",
				authUserId: "auth-user-42",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp-1",
			},
		});
	});

	it("derives tenant and role from Better Auth session when assertions are omitted", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-42" },
			user: {
				id: "auth-user-42",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "admin",
				activeCompanyId: "cmp-session-42",
			},
		} as never);

		const result = await resolveSessionContext({
			headers: {
				cookie: "better-auth.session_token=test-session",
			},
			requestedCompanyId: "cmp-session-42",
		});

		expect(result).toEqual({
			ok: true,
			context: {
				userId: "auth-user-42",
				authUserId: "auth-user-42",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "admin",
				companyId: "cmp-session-42",
			},
		});
	});

	it("rejects conflicting x-company-id and x-active-company-id headers", async () => {
		const result = await resolveSessionContext({
			headers: {
				"x-auth-user-id": "usr-1",
				"x-user-role": "admin",
				"x-company-id": "cmp-a",
				"x-active-company-id": "cmp-b",
			},
			requireSession: false,
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_CONFLICT",
		});
	});

	it("denies spoofable header-only context on sensitive routes", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const result = await resolveSessionContext({
			headers: {
				"x-auth-user-id": "usr-spoof",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
			requestedCompanyId: "cmp-1",
			requireSession: false,
			securityProfile: "sensitive-write",
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "SPOOFABLE_HEADER_CONTEXT",
		});
	});

	it("allows signed allowlisted machine callers on sensitive routes", async () => {
		const now = Date.now().toString();
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = "machine-secret";
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const signature = createHmac(
			"sha256",
			process.env.ARKELYTHEX_MACHINE_CALLER_SECRET,
		)
			.update(["ledger-orchestrator", now, "cmp-1", "admin"].join("."))
			.digest("hex");

		const result = await resolveSessionContext({
			headers: {
				"x-ark-service-id": "ledger-orchestrator",
				"x-ark-service-role": "admin",
				"x-ark-service-company-id": "cmp-1",
				"x-ark-service-timestamp": now,
				"x-ark-service-signature": `sha256=${signature}`,
				"x-company-id": "cmp-1",
			},
			requestedCompanyId: "cmp-1",
			requireSession: false,
			allowMachineCaller: true,
			machineCallerAllowlist: ["ledger-orchestrator"],
			securityProfile: "sensitive-write",
		});

		expect(result).toEqual({
			ok: true,
			context: {
				userId: "service:ledger-orchestrator",
				authUserId: "service:ledger-orchestrator",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp-1",
			},
		});
	});
});
