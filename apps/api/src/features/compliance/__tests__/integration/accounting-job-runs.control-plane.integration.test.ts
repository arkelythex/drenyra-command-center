import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountingJobRunsService } from "../../../../services/accounting-job-runs.service";
import { auth } from "../../../auth/auth.config";
import { complianceModule } from "../../index";

async function post(
	app: Elysia,
	path: string,
	body: unknown,
): Promise<Response> {
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				cookie: "better-auth.session_token=test-session",
				"x-auth-user-id": "auth-user-1",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
			body: JSON.stringify(body),
		}),
	);
}

describe("accounting job runs control-plane integration", () => {
	const app = new Elysia().use(complianceModule);

	beforeEach(() => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "admin",
				activeCompanyId: "cmp-1",
			},
		} as never);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("forwards control-plane baseline fields when creating representative runs", async () => {
		const createSpy = vi
			.spyOn(AccountingJobRunsService, "createRun")
			.mockResolvedValue({
				id: "run-1",
				companyId: "cmp-1",
				countryCode: "pe",
				jobId: "prepare-sire",
				jobTitle: "Preparar SIRE",
				jobCategory: "compliance",
				status: "AWAITING_APPROVAL",
				approvalRequired: true,
				requestedBy: "11111111-1111-1111-1111-111111111111",
				approvedBy: null,
				prompt: "Preparar SIRE del periodo actual",
				summary: null,
				inputPayload: {},
				resultPayload: null,
				evidencePayload: null,
				startedAt: new Date("2026-04-01T10:00:00.000Z"),
				completedAt: null,
				createdAt: new Date("2026-04-01T10:00:00.000Z"),
				updatedAt: new Date("2026-04-01T10:00:00.000Z"),
			});

		const response = await post(app, "/api/compliance/accounting-job-runs", {
			companyId: "cmp-1",
			countryCode: "pe",
			jobId: "prepare-sire",
			traceId: "trace-prepare-sire-1",
			requestedTools: ["sunat-rule-pack"],
			requestedCorpora: ["sunat-sire-manuals"],
		});
		const payload = await response.json();

		expect(response.status).toBe(201);
		expect(payload.success).toBe(true);
		expect(createSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				traceId: "trace-prepare-sire-1",
				requestedTools: ["sunat-rule-pack"],
				requestedCorpora: ["sunat-sire-manuals"],
			}),
		);
	});

	it("returns representative path trace errors on execution when traceId is missing", async () => {
		vi.spyOn(
			AccountingJobRunsService,
			"executeRepresentativeSupervisedRun",
		).mockRejectedValue(new Error("CONTEXT_TRACE_ID_REQUIRED"));

		const response = await post(
			app,
			"/api/compliance/accounting-job-runs/run-legacy/execute",
			{
				companyId: "cmp-1",
				period: "2026-03",
			},
		);
		const payload = await response.json();

		expect(response.status).toBe(409);
		expect(payload.code).toBe("CONTEXT_TRACE_ID_REQUIRED");
	});
});
