import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../../auth/auth.config";
import { resolveSessionContext } from "../../session-context";

describe("session-context integration", () => {
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

	it("uses Better Auth tenant context instead of trusting tenant headers as identity sources", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-99" },
			user: {
				id: "auth-user-99",
				legacyUserId: "legacy-user-99",
				role: "admin",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const app = new Elysia().get(
			"/security-probe",
			async ({ headers, set }) => {
				const result = await resolveSessionContext({
					headers,
					requestedCompanyId: "cmp-session",
				});

				if (!result.ok) {
					set.status = result.status;
					return result;
				}

				return result.context;
			},
		);

		const response = await app.handle(
			new Request("http://localhost/security-probe", {
				headers: {
					cookie: "better-auth.session_token=test-session",
					"x-auth-user-id": "auth-user-99",
					"x-user-id": "legacy-user-99",
					"x-user-role": "admin",
					"x-company-id": "cmp-session",
				},
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			userId: "auth-user-99",
			authUserId: "auth-user-99",
			legacyUserId: "legacy-user-99",
			role: "admin",
			companyId: "cmp-session",
		});
	});
});
