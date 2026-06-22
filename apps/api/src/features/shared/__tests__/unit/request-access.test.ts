import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../../auth/auth.config";
import {
	resolveGovernanceAuditAccess,
	resolveGovernanceMetricsAccess,
} from "../../request-access";

describe("request access guards", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("allows governance audit when session user and tenant scope match", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: {
				id: "user-session-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "owner",
				activeCompanyId: "cmp-1",
			},
			session: { id: "sess-1" },
		} as never);

		const result = await resolveGovernanceAuditAccess(
			{
				cookie: "better-auth.session_token=test-session",
				"x-company-id": "cmp-1",
				"x-user-role": "owner",
				"x-auth-user-id": "user-session-1",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
			},
			"cmp-1",
		);

		expect(result).toMatchObject({
			ok: true,
			context: {
				userId: "user-session-1",
				authUserId: "user-session-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				companyId: "cmp-1",
				role: "owner",
			},
		});
	});

	it("rejects when session user and header user mismatch", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: { id: "session-user" },
		} as never);

		const result = await resolveGovernanceAuditAccess(
			{
				cookie: "better-auth.session_token=test-session",
				"x-company-id": "cmp-1",
				"x-user-role": "owner",
				"x-auth-user-id": "header-user",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
			},
			"cmp-1",
		);

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_MISMATCH",
		});
	});

	it("rejects when session legacy user and header legacy user mismatch", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: {
				id: "session-user",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
			},
		} as never);

		const result = await resolveGovernanceAuditAccess(
			{
				cookie: "better-auth.session_token=test-session",
				"x-company-id": "cmp-1",
				"x-user-role": "owner",
				"x-auth-user-id": "session-user",
				"x-user-id": "22222222-2222-2222-2222-222222222222",
			},
			"cmp-1",
		);

		expect(result).toMatchObject({
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_MISMATCH",
		});
	});

	it("requires session in non-test env when fallback is disabled", async () => {
		process.env.NODE_ENV = "development";
		process.env.GOVERNANCE_AUDIT_ALLOW_HEADER_AUTH_FALLBACK = "false";
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const result = await resolveGovernanceAuditAccess(
			{
				"x-company-id": "cmp-1",
				"x-user-role": "owner",
				"x-auth-user-id": "header-user",
			},
			"cmp-1",
		);

		expect(result).toMatchObject({
			ok: false,
			status: 401,
			code: "SESSION_REQUIRED",
		});
	});

	it("allows header fallback in non-test env when fallback is enabled", async () => {
		process.env.NODE_ENV = "development";
		process.env.GOVERNANCE_AUDIT_ALLOW_HEADER_AUTH_FALLBACK = "true";
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const result = await resolveGovernanceMetricsAccess({
			"x-company-id": "cmp-1",
			"x-user-role": "admin",
			"x-auth-user-id": "header-user",
			"x-user-id": "11111111-1111-1111-1111-111111111111",
		});

		expect(result).toMatchObject({
			ok: true,
			context: {
				userId: "header-user",
				authUserId: "header-user",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "admin",
			},
		});
	});
});
