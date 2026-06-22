import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComplianceRoadmapService } from "../../../../services/compliance-roadmap.service";
import { auth } from "../../../auth/auth.config";
import * as sessionContextModule from "../../../security/session-context";
import { complianceModule } from "../../index";

describe("compliance roadmap mvp routes", () => {
	const app = new Elysia().use(complianceModule);
	const authenticatedHumanHeaders = {
		"content-type": "application/json",
		cookie: "better-auth.session_token=test-session",
		"x-auth-user-id": "auth-user-1",
		"x-user-id": "11111111-1111-1111-1111-111111111111",
		"x-user-role": "admin",
		"x-company-id": "cmp-1",
	};

	function mockAuthenticatedHumanSession(): void {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "ADMIN",
				companyId: "cmp-1",
				activeCompanyId: "cmp-1",
			},
		} as never);
	}

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns phase 1 and phase 2 roadmap snapshot", async () => {
		mockAuthenticatedHumanSession();

		vi.spyOn(
			ComplianceRoadmapService,
			"getRoadmapMvpSnapshot",
		).mockResolvedValue({
			companyId: "cmp-1",
			period: "2026-03",
			generatedAt: "2026-03-20T10:00:00.000Z",
			phase1: {
				objective: "Most reliable accounting operation in Peru",
				reliabilityScore: 91.2,
				sunatStatus: "COMPLIANT",
				blockingIssues: 1,
				openIssues: 3,
				ledgerReproducible: true,
				reproducibilityCoverage: "COMPLETE_DATA",
				differences: {
					recordCount: 0,
					totalAmount: 0,
					totalIGV: 0,
				},
				nextFocus: ["Close critical and high-severity compliance findings."],
			},
			phase2: {
				objective: "Accounting copilot with actionable automation",
				insightScore: 84.3,
				periodIncome: 25000,
				periodExpense: 19000,
				cashflowGap: 6000,
				overdueInvoices: 2,
				pendingSunatInvoices: 4,
				recommendedActions: [
					{
						id: "prepare-sire",
						traceId: "trace-0001",
						recommendedAt: "2026-03-20T10:00:00.000Z",
						title: "Prepare SIRE package with approval gate",
						description: "4 SUNAT-pending documents detected.",
						impact: "Reduces filing risk.",
						confidence: 0.91,
						automationLevel: "one-click",
					},
				],
			},
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp?companyId=cmp-1&year=2026&month=3",
				{ headers: authenticatedHumanHeaders },
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			companyId: "cmp-1",
			period: "2026-03",
			phase1: {
				reliabilityScore: 91.2,
				ledgerReproducible: true,
			},
			phase2: {
				insightScore: 84.3,
			},
		});
	});

	it("runs a one-click roadmap action", async () => {
		mockAuthenticatedHumanSession();

		vi.spyOn(ComplianceRoadmapService, "runRoadmapAction").mockResolvedValue({
			actionId: "prepare-sire",
			execution: "QUEUED_FOR_APPROVAL",
			message: "Automation queued with approval gate before execution.",
			runId: "run-1",
			runStatus: "AWAITING_APPROVAL",
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/actions/prepare-sire/run",
				{
					method: "POST",
					headers: authenticatedHumanHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
						year: 2026,
						month: 3,
						traceId: "trace-0001",
					}),
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			actionId: "prepare-sire",
			execution: "QUEUED_FOR_APPROVAL",
			runId: "run-1",
		});
		expect(ComplianceRoadmapService.runRoadmapAction).toHaveBeenCalledWith({
			companyId: "cmp-1",
			year: 2026,
			month: 3,
			actionId: "prepare-sire",
			traceId: "trace-0001",
			countryCode: undefined,
		});
	});

	it("allows authenticated human callers to run roadmap actions", async () => {
		mockAuthenticatedHumanSession();

		vi.spyOn(ComplianceRoadmapService, "runRoadmapAction").mockResolvedValue({
			actionId: "prepare-sire",
			execution: "QUEUED_FOR_APPROVAL",
			message: "Automation queued with approval gate before execution.",
			runId: "run-1",
			runStatus: "AWAITING_APPROVAL",
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/actions/prepare-sire/run",
				{
					method: "POST",
					headers: authenticatedHumanHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
						year: 2026,
						month: 3,
						traceId: "trace-0001",
					}),
				},
			),
		);

		expect(response.status).toBe(200);
		expect(ComplianceRoadmapService.runRoadmapAction).toHaveBeenCalledTimes(1);
	});

	it("rejects GET roadmap snapshot when no auth headers are provided", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp?companyId=cmp-1&year=2026&month=3",
				{ headers: { "content-type": "application/json" } },
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("SESSION_REQUIRED");
	});

	it("rejects GET roadmap timeline when no auth headers are provided", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/timeline/prepare-sire?companyId=cmp-1&year=2026&month=3&traceId=trace-0001",
				{ headers: { "content-type": "application/json" } },
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("SESSION_REQUIRED");
	});

	it("rejects roadmap action run when caller context is missing", async () => {
		const runRoadmapActionSpy = vi
			.spyOn(ComplianceRoadmapService, "runRoadmapAction")
			.mockResolvedValue({
				actionId: "prepare-sire",
				execution: "QUEUED_FOR_APPROVAL",
				message: "Automation queued with approval gate before execution.",
				runId: "run-1",
				runStatus: "AWAITING_APPROVAL",
			});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/actions/prepare-sire/run",
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
					},
					body: JSON.stringify({
						companyId: "cmp-1",
						year: 2026,
						month: 3,
						traceId: "trace-0001",
					}),
				},
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("AUTH_REQUIRED");
		expect(runRoadmapActionSpy).not.toHaveBeenCalled();
	});

	it("rejects untrusted machine callers for roadmap action run", async () => {
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = "machine-secret";
		process.env.ROADMAP_MVP_MACHINE_CALLER_ALLOWLIST = "trusted-service";

		const runRoadmapActionSpy = vi
			.spyOn(ComplianceRoadmapService, "runRoadmapAction")
			.mockResolvedValue({
				actionId: "prepare-sire",
				execution: "QUEUED_FOR_APPROVAL",
				message: "Automation queued with approval gate before execution.",
				runId: "run-1",
				runStatus: "AWAITING_APPROVAL",
			});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/actions/prepare-sire/run",
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
						"x-ark-service-id": "rogue-service",
						"x-ark-service-role": "service",
						"x-ark-service-company-id": "cmp-1",
						"x-ark-service-timestamp": Date.now().toString(),
						"x-ark-service-signature": "sha256=invalid-signature",
					},
					body: JSON.stringify({
						companyId: "cmp-1",
						year: 2026,
						month: 3,
						traceId: "trace-0001",
					}),
				},
			),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("MACHINE_CALLER_FORBIDDEN");
		expect(runRoadmapActionSpy).not.toHaveBeenCalled();
	});

	it("fails closed when caller resolution raises an internal error", async () => {
		const runRoadmapActionSpy = vi
			.spyOn(ComplianceRoadmapService, "runRoadmapAction")
			.mockResolvedValue({
				actionId: "prepare-sire",
				execution: "QUEUED_FOR_APPROVAL",
				message: "Automation queued with approval gate before execution.",
				runId: "run-1",
				runStatus: "AWAITING_APPROVAL",
			});
		vi.spyOn(sessionContextModule, "resolveSessionContext").mockRejectedValue(
			new Error("SESSION_RESOLVER_DOWN"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/actions/prepare-sire/run",
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
					},
					body: JSON.stringify({
						companyId: "cmp-1",
						year: 2026,
						month: 3,
						traceId: "trace-0001",
					}),
				},
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("AUTH_RESOLUTION_FAILED");
		expect(runRoadmapActionSpy).not.toHaveBeenCalled();
	});

	it("returns 404 when action is not available for period", async () => {
		mockAuthenticatedHumanSession();

		vi.spyOn(ComplianceRoadmapService, "runRoadmapAction").mockRejectedValue(
			new Error("ROADMAP_ACTION_NOT_AVAILABLE"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/actions/prepare-sire/run",
				{
					method: "POST",
					headers: authenticatedHumanHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
						year: 2026,
						month: 3,
						traceId: "trace-0001",
					}),
				},
			),
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("ROADMAP_ACTION_NOT_AVAILABLE");
	});

	it("returns 409 when automation action is not supported for selected country pack", async () => {
		mockAuthenticatedHumanSession();

		vi.spyOn(ComplianceRoadmapService, "runRoadmapAction").mockRejectedValue(
			new Error("ACCOUNTING_JOB_NOT_SUPPORTED"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/actions/prepare-sire/run",
				{
					method: "POST",
					headers: authenticatedHumanHeaders,
					body: JSON.stringify({
						companyId: "cmp-1",
						year: 2026,
						month: 3,
						traceId: "trace-0001",
						countryCode: "ar",
					}),
				},
			),
		);

		expect(response.status).toBe(409);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("ACCOUNTING_JOB_NOT_SUPPORTED");
		expect(ComplianceRoadmapService.runRoadmapAction).toHaveBeenCalledWith({
			companyId: "cmp-1",
			year: 2026,
			month: 3,
			actionId: "prepare-sire",
			traceId: "trace-0001",
			countryCode: "ar",
		});
	});

	it("registers roadmap decision with mandatory trace identifier", async () => {
		mockAuthenticatedHumanSession();

		const decideRoadmapActionSpy = vi
			.spyOn(ComplianceRoadmapService, "decideRoadmapAction")
			.mockResolvedValue({
				actionId: "prepare-sire",
				traceId: "trace-0001",
				decision: "APPROVE",
				reason: "Validado por supervisor",
				message: "Decision approved and queued for controlled execution.",
				runId: "run-1",
				runStatus: "AWAITING_APPROVAL",
			});

		const response = await app.handle(
			new Request("http://localhost/api/compliance/roadmap-mvp/decisions", {
				method: "POST",
				headers: authenticatedHumanHeaders,
				body: JSON.stringify({
					companyId: "cmp-1",
					year: 2026,
					month: 3,
					actionId: "prepare-sire",
					traceId: "trace-0001",
					decision: "APPROVE",
					reason: "Validado por supervisor",
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			traceId: "trace-0001",
			runId: "run-1",
		});
		expect(decideRoadmapActionSpy).toHaveBeenCalledWith({
			companyId: "cmp-1",
			year: 2026,
			month: 3,
			actionId: "prepare-sire",
			traceId: "trace-0001",
			decision: "APPROVE",
			reason: "Validado por supervisor",
			countryCode: undefined,
			decidedBy: "11111111-1111-1111-1111-111111111111",
		});
	});

	it("returns timeline stitched for one roadmap action trace", async () => {
		mockAuthenticatedHumanSession();

		vi.spyOn(
			ComplianceRoadmapService,
			"getRoadmapActionTimeline",
		).mockResolvedValue({
			companyId: "cmp-1",
			period: "2026-03",
			traceId: "trace-0001",
			actionId: "prepare-sire",
			recommendation: {
				id: "prepare-sire",
				traceId: "trace-0001",
				recommendedAt: "2026-03-20T10:00:00.000Z",
				title: "Prepare SIRE package with approval gate",
				description: "4 SUNAT-pending documents detected.",
				impact: "Reduces filing risk.",
				confidence: 0.91,
				automationLevel: "one-click",
			},
			events: [
				{
					type: "RECOMMENDATION",
					at: "2026-03-20T10:00:00.000Z",
					actionId: "prepare-sire",
					traceId: "trace-0001",
					status: "RECOMMENDED",
					summary: "Prepare SIRE package with approval gate",
				},
			],
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/roadmap-mvp/timeline/prepare-sire?companyId=cmp-1&year=2026&month=3&traceId=trace-0001",
				{ headers: authenticatedHumanHeaders },
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			traceId: "trace-0001",
			actionId: "prepare-sire",
		});
	});
});
