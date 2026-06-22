import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../auth/auth.config";
import {
	AUTHENTICATED_CALLER_KIND,
	resolveAuthenticatedCaller,
	resolveTrustedMachineCallerAllowlist,
} from "../authenticated-caller";

describe("authenticated-caller", () => {
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

	it("derives caller tenant and role from Better Auth session", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-1",
				legacyUserId: "legacy-user-1",
				role: "OWNER",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const result = await resolveAuthenticatedCaller({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-auth-user-id": "auth-user-1",
				"x-user-id": "legacy-user-1",
				"x-user-role": "owner",
				"x-company-id": "cmp-session",
			},
			requestedCompanyId: "cmp-session",
		});

		expect(result).toEqual({
			ok: true,
			caller: {
				kind: AUTHENTICATED_CALLER_KIND.SESSION,
				userId: "auth-user-1",
				authUserId: "auth-user-1",
				legacyUserId: "legacy-user-1",
				role: "owner",
				companyId: "cmp-session",
				sessionId: "sess-1",
				serviceId: null,
			},
		});
	});

	it("rejects a tenant assertion that does not match the session tenant", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: {
				id: "auth-user-1",
				role: "admin",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const result = await resolveAuthenticatedCaller({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-user-role": "admin",
				"x-company-id": "cmp-header",
			},
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_MISMATCH",
		});
	});

	it("rejects a role assertion that does not match the session role", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: {
				id: "auth-user-1",
				role: "admin",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const result = await resolveAuthenticatedCaller({
			headers: {
				cookie: "better-auth.session_token=test-session",
				"x-user-role": "owner",
				"x-company-id": "cmp-session",
			},
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_MISMATCH",
		});
	});

	it("supports explicit signed machine callers when enabled", async () => {
		const now = Date.now().toString();
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = "machine-secret";
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const signature = createHmac(
			"sha256",
			process.env.ARKELYTHEX_MACHINE_CALLER_SECRET,
		)
			.update(["agent-orchestrator", now, "cmp-machine", "service"].join("."))
			.digest("hex");

		const result = await resolveAuthenticatedCaller({
			headers: {
				"x-ark-service-id": "agent-orchestrator",
				"x-ark-service-role": "service",
				"x-ark-service-company-id": "cmp-machine",
				"x-ark-service-timestamp": now,
				"x-ark-service-signature": `sha256=${signature}`,
				"x-company-id": "cmp-machine",
			},
			allowMachineCaller: true,
			machineCallerAllowlist: ["agent-orchestrator"],
			requireSession: false,
			requireTenant: true,
			requireRole: true,
		});

		expect(result).toEqual({
			ok: true,
			caller: {
				kind: AUTHENTICATED_CALLER_KIND.MACHINE,
				userId: "service:agent-orchestrator",
				authUserId: "service:agent-orchestrator",
				legacyUserId: null,
				role: "service",
				companyId: "cmp-machine",
				sessionId: null,
				serviceId: "agent-orchestrator",
			},
		});
	});

	it("fails closed for invalid machine signatures", async () => {
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = "machine-secret";
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const result = await resolveAuthenticatedCaller({
			headers: {
				"x-ark-service-id": "agent-orchestrator",
				"x-ark-service-role": "service",
				"x-ark-service-company-id": "cmp-machine",
				"x-ark-service-timestamp": Date.now().toString(),
				"x-ark-service-signature": "sha256=bad-signature",
			},
			allowMachineCaller: true,
			machineCallerAllowlist: ["agent-orchestrator"],
			requireSession: false,
			requireTenant: true,
			requireRole: true,
		});

		expect(result).toMatchObject({
			ok: false,
			status: 401,
			code: "MACHINE_AUTH_INVALID",
		});
	});

	it("rejects signed machine callers that are not in the explicit allowlist", async () => {
		const now = Date.now().toString();
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = "machine-secret";
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const signature = createHmac(
			"sha256",
			process.env.ARKELYTHEX_MACHINE_CALLER_SECRET,
		)
			.update(["rogue-service", now, "cmp-machine", "service"].join("."))
			.digest("hex");

		const result = await resolveAuthenticatedCaller({
			headers: {
				"x-ark-service-id": "rogue-service",
				"x-ark-service-role": "service",
				"x-ark-service-company-id": "cmp-machine",
				"x-ark-service-timestamp": now,
				"x-ark-service-signature": `sha256=${signature}`,
			},
			allowMachineCaller: true,
			machineCallerAllowlist: ["agent-orchestrator"],
			requireSession: false,
			requireTenant: true,
			requireRole: true,
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "MACHINE_CALLER_FORBIDDEN",
		});
	});

	it("denies spoofable header-only context when header fallback is disabled", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const result = await resolveAuthenticatedCaller({
			headers: {
				"x-auth-user-id": "usr-spoof",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
			allowMachineCaller: true,
			machineCallerAllowlist: ["agent-orchestrator"],
			requireSession: false,
			allowHeaderFallback: false,
			requireTenant: true,
			requireRole: true,
		});

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "SPOOFABLE_HEADER_CONTEXT",
		});
	});

	it("resolves trusted machine allowlist from a route-specific env variable", () => {
		process.env.ROADMAP_MVP_MACHINE_CALLER_ALLOWLIST =
			" trusted-service,agent-orchestrator ";

		expect(
			resolveTrustedMachineCallerAllowlist({
				envVarName: "ROADMAP_MVP_MACHINE_CALLER_ALLOWLIST",
			}),
		).toEqual(["trusted-service", "agent-orchestrator"]);
	});

	it("prefers explicit trusted machine allowlist over environment", () => {
		process.env.ROADMAP_MVP_MACHINE_CALLER_ALLOWLIST = "from-env";

		expect(
			resolveTrustedMachineCallerAllowlist({
				allowlist: ["from-input"],
				envVarName: "ROADMAP_MVP_MACHINE_CALLER_ALLOWLIST",
			}),
		).toEqual(["from-input"]);
	});
});
