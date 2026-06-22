import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock resolveSessionContext so the companyScopeGuard doesn't reject requests
vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

import { sireModule } from "../../index";
import * as companyScopeResolver from "../../middleware/company-scope-resolver";
import { resetSireRateLimitStateForTests } from "../../middleware/rate-limit.middleware";
import * as auditModule from "../../services/sire-submission-with-audit.service";
import {
	createSireAuthHeaders,
	createSireTestJwtWithClaims,
} from "../support/sire-auth-test-helpers";

describe("sire submit route", () => {
	const app = new Elysia().use(sireModule);
	const validBody = {
		companyId: "cmp_123",
		period: "2026-02",
		ledgerType: "ventas" as const,
		payloadFormat: "txt" as const,
		payloadBase64: "dGVzdA==",
	};

	let submitSpy: ReturnType<typeof vi.spyOn>;
	let blockedSpy: ReturnType<typeof vi.spyOn>;
	const originalEnv = { ...process.env };
	const jwtSecret = "test-sire-secret-12345678901234567890";

	beforeEach(() => {
		vi.clearAllMocks();
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp_123",
			},
		});
		submitSpy = vi.spyOn(auditModule, "submitWithAudit");
		blockedSpy = vi
			.spyOn(auditModule, "logBlockedSubmissionAttempt")
			.mockResolvedValue();
		process.env = { ...originalEnv };
		process.env.SIRE_JWT_SECRET = jwtSecret;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		resetSireRateLimitStateForTests();
		process.env = { ...originalEnv };
	});

	it("returns 202 and success envelope when submission succeeds", async () => {
		submitSpy.mockResolvedValue({
			submissionId: "SIM-123",
			status: "SIMULATED",
			provider: "simulation",
			submittedAt: "2026-02-13T00:00:00.000Z",
			period: "2026-02",
			ledgerType: "ventas",
			dryRun: false,
			message: "SIRE submission simulated",
		});

		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers: createSireAuthHeaders(validBody.companyId, jwtSecret, {
					"content-type": "application/json",
				}),
				body: JSON.stringify(validBody),
			}),
		);

		expect(response.status).toBe(202);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				submissionId: "SIM-123",
				provider: "simulation",
			},
		});
	});

	it("returns 400 for validation-like failures", async () => {
		submitSpy.mockRejectedValue(
			new Error("Invalid period format: expected YYYY-MM"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers: createSireAuthHeaders(validBody.companyId, jwtSecret, {
					"content-type": "application/json",
				}),
				body: JSON.stringify(validBody),
			}),
		);

		expect(response.status).toBe(400);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SIRE_SUBMISSION_ERROR",
		});
	});

	it("returns 401 when upstream auth fails", async () => {
		submitSpy.mockRejectedValue(
			new Error("SIRE API request failed (401): Unauthorized"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers: createSireAuthHeaders(validBody.companyId, jwtSecret, {
					"content-type": "application/json",
				}),
				body: JSON.stringify(validBody),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SIRE_SUBMISSION_ERROR",
			error: "SIRE API request failed (401): Unauthorized",
		});
	});

	it("returns policy block when kill switch is active", async () => {
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "true";

		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers: createSireAuthHeaders(validBody.companyId, jwtSecret, {
					"content-type": "application/json",
				}),
				body: JSON.stringify(validBody),
			}),
		);

		expect(response.status).toBe(503);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "AUTONOMY_KILL_SWITCH_ACTIVE",
		});
		expect(submitSpy).not.toHaveBeenCalled();
		expect(blockedSpy).toHaveBeenCalledOnce();
	});

	it("returns 401 when bearer token is missing", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"X-Company-Id": validBody.companyId,
				},
				body: JSON.stringify(validBody),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SIRE_AUTH_REQUIRED",
		});
	});

	it("returns 403 when JWT company does not match the request company", async () => {
		const headers = createSireAuthHeaders("cmp_other", jwtSecret, {
			"content-type": "application/json",
		});
		headers.set("X-Company-Id", validBody.companyId);

		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers,
				body: JSON.stringify(validBody),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SIRE_COMPANY_FORBIDDEN",
		});
	});

	it("accepts JWTs with legacy organizationId claims after company resolution", async () => {
		submitSpy.mockResolvedValue({
			submissionId: "SIM-ORG-1",
			status: "SIMULATED",
			provider: "simulation",
			submittedAt: "2026-02-13T00:00:00.000Z",
			period: "2026-02",
			ledgerType: "ventas",
			dryRun: false,
			message: "SIRE submission simulated",
		});
		vi.spyOn(
			companyScopeResolver,
			"resolveCompanyIdFromLegacyOrganizationClaim",
		).mockResolvedValue(validBody.companyId);

		const headers = new Headers({
			Authorization: `Bearer ${createSireTestJwtWithClaims(
				{
					sub: "legacy-user",
					organizationId: 42,
					exp: Math.floor(Date.now() / 1000) + 60 * 60,
				},
				jwtSecret,
			)}`,
			"content-type": "application/json",
			"X-Company-Id": validBody.companyId,
		});

		const response = await app.handle(
			new Request("http://localhost/api/sire/submit", {
				method: "POST",
				headers,
				body: JSON.stringify(validBody),
			}),
		);

		expect(response.status).toBe(202);
		expect(
			companyScopeResolver.resolveCompanyIdFromLegacyOrganizationClaim,
		).toHaveBeenCalledWith(42);
	});
});
