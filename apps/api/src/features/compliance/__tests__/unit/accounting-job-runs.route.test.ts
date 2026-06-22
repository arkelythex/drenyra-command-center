import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountingJobRunsService } from "../../../../services/accounting-job-runs.service";
import { auth } from "../../../auth/auth.config";
import { complianceModule } from "../../index";

describe("compliance accounting job runs route", () => {
	const app = new Elysia().use(complianceModule);
	const authenticatedHeaders = {
		"content-type": "application/json",
		cookie: "better-auth.session_token=test-session",
		"x-auth-user-id": "auth-user-1",
		"x-user-id": "11111111-1111-1111-1111-111111111111",
		"x-user-role": "admin",
		"x-company-id": "cmp-1",
	};

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

	it("lists recent accounting job runs", async () => {
		vi.spyOn(AccountingJobRunsService, "listRuns").mockResolvedValue([
			{
				id: "run-1",
				companyId: "cmp-1",
				countryCode: "pe",
				jobId: "prepare-sire",
				jobTitle: "Preparar SIRE",
				jobCategory: "compliance",
				status: "AWAITING_APPROVAL",
				approvalRequired: true,
				requestedBy: "usr-1",
				approvedBy: null,
				prompt: "Preparar SIRE del periodo actual",
				summary: null,
				inputPayload: {},
				resultPayload: null,
				evidencePayload: null,
				startedAt: new Date("2026-03-04T10:00:00.000Z"),
				completedAt: null,
				createdAt: new Date("2026-03-04T10:00:00.000Z"),
				updatedAt: new Date("2026-03-04T10:00:00.000Z"),
			},
		]);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs?companyId=cmp-1",
				{ headers: authenticatedHeaders },
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			companyId: "cmp-1",
			count: 1,
		});
	});

	it("creates one accounting job run", async () => {
		const createRunSpy = vi
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
				requestedBy: "usr-1",
				approvedBy: null,
				prompt: "Preparar SIRE del periodo actual",
				summary: null,
				inputPayload: {},
				resultPayload: null,
				evidencePayload: null,
				startedAt: new Date("2026-03-04T10:00:00.000Z"),
				completedAt: null,
				createdAt: new Date("2026-03-04T10:00:00.000Z"),
				updatedAt: new Date("2026-03-04T10:00:00.000Z"),
			});

		const response = await app.handle(
			new Request("http://localhost/api/compliance/accounting-job-runs", {
				method: "POST",
				headers: authenticatedHeaders,
				body: JSON.stringify({
					companyId: "cmp-1",
					countryCode: "pe",
					jobId: "prepare-sire",
				}),
			}),
		);

		expect(response.status).toBe(201);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			id: "run-1",
			jobId: "prepare-sire",
			status: "AWAITING_APPROVAL",
		});
		expect(createRunSpy).toHaveBeenCalledWith({
			companyId: "cmp-1",
			countryCode: "pe",
			jobId: "prepare-sire",
			traceId: expect.any(String),
			requestedBy: "11111111-1111-1111-1111-111111111111",
		});
	});

	it("returns 404 when one job is not supported", async () => {
		vi.spyOn(AccountingJobRunsService, "createRun").mockRejectedValue(
			new Error("ACCOUNTING_JOB_NOT_SUPPORTED"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/compliance/accounting-job-runs", {
				method: "POST",
				headers: authenticatedHeaders,
				body: JSON.stringify({
					companyId: "cmp-1",
					countryCode: "ar",
					jobId: "unsupported-job",
				}),
			}),
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("ACCOUNTING_JOB_NOT_SUPPORTED");
	});

	it("updates one accounting job run status", async () => {
		const updateRunStatusSpy = vi
			.spyOn(AccountingJobRunsService, "updateRunStatus")
			.mockResolvedValue({
				id: "run-1",
				companyId: "cmp-1",
				countryCode: "pe",
				jobId: "prepare-sire",
				jobTitle: "Preparar SIRE",
				jobCategory: "compliance",
				status: "RUNNING",
				approvalRequired: false,
				requestedBy: "usr-1",
				approvedBy: null,
				prompt: "Preparar SIRE del periodo actual",
				summary: "Preparar SIRE en ejecución",
				inputPayload: {},
				resultPayload: null,
				evidencePayload: null,
				startedAt: new Date("2026-03-04T10:00:00.000Z"),
				completedAt: null,
				createdAt: new Date("2026-03-04T10:00:00.000Z"),
				updatedAt: new Date("2026-03-04T10:01:00.000Z"),
			});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs/run-1/status",
				{
					method: "PATCH",
					headers: authenticatedHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
						status: "RUNNING",
						summary: "Preparar SIRE en ejecución",
					}),
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			id: "run-1",
			status: "RUNNING",
		});
		expect(updateRunStatusSpy).toHaveBeenCalledWith({
			id: "run-1",
			companyId: "cmp-1",
			status: "RUNNING",
			summary: "Preparar SIRE en ejecución",
			approvedBy: "11111111-1111-1111-1111-111111111111",
			resultPayload: undefined,
			evidencePayload: undefined,
		});
	});

	it("returns 409 when the requested status transition is invalid", async () => {
		vi.spyOn(AccountingJobRunsService, "updateRunStatus").mockRejectedValue(
			new Error("ACCOUNTING_JOB_RUN_INVALID_TRANSITION"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs/run-1/status",
				{
					method: "PATCH",
					headers: authenticatedHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
						status: "RUNNING",
					}),
				},
			),
		);

		expect(response.status).toBe(409);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("ACCOUNTING_JOB_RUN_INVALID_TRANSITION");
	});

	it("executes a supported prepare-sire job run", async () => {
		vi.spyOn(
			AccountingJobRunsService,
			"executeRepresentativeSupervisedRun",
		).mockResolvedValue({
			id: "run-1",
			companyId: "cmp-1",
			countryCode: "pe",
			jobId: "prepare-sire",
			jobTitle: "Preparar SIRE",
			jobCategory: "compliance",
			status: "COMPLETED",
			approvalRequired: false,
			requestedBy: "usr-1",
			approvedBy: null,
			prompt: "Preparar SIRE del periodo actual",
			summary: "SIRE 2026-03 listo · 4 ventas · 3 compras",
			inputPayload: {},
			resultPayload: {
				period: "2026-03",
			},
			evidencePayload: {
				period: "2026-03",
			},
			startedAt: new Date("2026-03-04T10:00:00.000Z"),
			completedAt: new Date("2026-03-04T10:03:00.000Z"),
			createdAt: new Date("2026-03-04T10:00:00.000Z"),
			updatedAt: new Date("2026-03-04T10:03:00.000Z"),
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs/run-1/execute",
				{
					method: "POST",
					headers: authenticatedHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
						period: "2026-03",
					}),
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			id: "run-1",
			status: "COMPLETED",
			summary: "SIRE 2026-03 listo · 4 ventas · 3 compras",
		});
	});

	it("returns 409 when a run has no automated executor", async () => {
		vi.spyOn(
			AccountingJobRunsService,
			"executeRepresentativeSupervisedRun",
		).mockRejectedValue(
			new Error("ACCOUNTING_JOB_RUN_EXECUTION_NOT_SUPPORTED"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs/run-1/execute",
				{
					method: "POST",
					headers: authenticatedHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
					}),
				},
			),
		);

		expect(response.status).toBe(409);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("ACCOUNTING_JOB_RUN_EXECUTION_NOT_SUPPORTED");
	});

	it("rejects list runs request when no auth headers are provided", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs?companyId=cmp-1",
				{ headers: { "content-type": "application/json" } },
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("SESSION_REQUIRED");
	});

	it("denies spoofable header-only context on write routes", async () => {
		const createRunSpy = vi.spyOn(AccountingJobRunsService, "createRun");

		const response = await app.handle(
			new Request("http://localhost/api/compliance/accounting-job-runs", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-auth-user-id": "auth-user-1",
					"x-user-id": "11111111-1111-1111-1111-111111111111",
					"x-user-role": "admin",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify({
					companyId: "cmp-1",
					jobId: "prepare-sire",
				}),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SPOOFABLE_HEADER_CONTEXT",
		});
		expect(createRunSpy).not.toHaveBeenCalled();
	});

	it("denies spoofable header-only context on status update route", async () => {
		const updateRunStatusSpy = vi.spyOn(
			AccountingJobRunsService,
			"updateRunStatus",
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs/run-1/status",
				{
					method: "PATCH",
					headers: {
						"content-type": "application/json",
						"x-auth-user-id": "auth-user-1",
						"x-user-id": "11111111-1111-1111-1111-111111111111",
						"x-user-role": "admin",
						"x-company-id": "cmp-1",
					},
					body: JSON.stringify({
						companyId: "cmp-1",
						status: "RUNNING",
					}),
				},
			),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SPOOFABLE_HEADER_CONTEXT",
		});
		expect(updateRunStatusSpy).not.toHaveBeenCalled();
	});

	it("denies spoofable header-only context on execute route", async () => {
		const executeRunSpy = vi.spyOn(
			AccountingJobRunsService,
			"executeRepresentativeSupervisedRun",
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/accounting-job-runs/run-1/execute",
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
						"x-auth-user-id": "auth-user-1",
						"x-user-id": "11111111-1111-1111-1111-111111111111",
						"x-user-role": "admin",
						"x-company-id": "cmp-1",
					},
					body: JSON.stringify({
						companyId: "cmp-1",
						period: "2026-03",
					}),
				},
			),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SPOOFABLE_HEADER_CONTEXT",
		});
		expect(executeRunSpy).not.toHaveBeenCalled();
	});
});
