import { CONTEXT_EVALUATION_STATES } from "@arkelythex/application";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountingJobRunsService } from "../../../../services/accounting-job-runs.service";
import { contextControlPlaneRoute } from "../../api/context-control-plane.route";

async function get(path: string): Promise<Response> {
	const app = new Elysia().use(contextControlPlaneRoute);
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "GET",
			headers: {
				"x-auth-user-id": "auth-user-1",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
		}),
	);
}

describe("context control-plane route", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("lists registry-backed supervised surfaces", async () => {
		const response = await get(
			"/api/ai-swarm/context-control-plane/registry?companyId=cmp-1",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.count).toBeGreaterThan(0);
		expect(
			payload.data.surfaces.some(
				(surface: { surfaceId: string }) =>
					surface.surfaceId === "prepare-sire",
			),
		).toBe(true);
	});

	it("returns run state via control-plane lookup", async () => {
		vi.spyOn(AccountingJobRunsService, "getContextRunState").mockResolvedValue({
			runId: "run-1",
			traceId: "trace-1",
			surfaceId: "prepare-sire",
			approvalState: "approved",
			retrievalMode: "hybrid-documentary",
			contextWindow: {
				maxMemoryItems: 8,
				maxDocumentResults: 3,
				maxToolCalls: 4,
			},
			evaluationSummary: null,
		});

		const response = await get(
			"/api/ai-swarm/context-control-plane/runs/run-1/state?companyId=cmp-1",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.traceId).toBe("trace-1");
	});

	it("returns trace-id-required error for legacy runs without control-plane trace", async () => {
		vi.spyOn(AccountingJobRunsService, "getContextTrace").mockRejectedValue(
			new Error("CONTEXT_TRACE_ID_REQUIRED"),
		);

		const response = await get(
			"/api/ai-swarm/context-control-plane/runs/run-legacy/trace?companyId=cmp-1",
		);
		const payload = await response.json();

		expect(response.status).toBe(409);
		expect(payload.code).toBe("CONTEXT_TRACE_ID_REQUIRED");
	});

	it("returns evaluation summary for run with persisted trace", async () => {
		vi.spyOn(
			AccountingJobRunsService,
			"getContextEvaluationSummary",
		).mockResolvedValue({
			state: CONTEXT_EVALUATION_STATES.GREEN,
			metrics: [
				{
					metric: "document_coverage",
					value: 0.92,
					window: "90d",
					target: 0.85,
					blocker: 0.7,
					unit: "ratio",
				},
				{
					metric: "tool_call_success_rate",
					value: 15,
					window: "30d",
					target: 12,
					blocker: 8,
					unit: "count",
				},
			],
			generatedAt: "2026-04-03T10:30:00.000Z",
			notes: ["All threshold checks passed"],
		});

		const response = await get(
			"/api/ai-swarm/context-control-plane/runs/run-1/evaluation?companyId=cmp-1",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.runId).toBe("run-1");
		expect(payload.data.evaluationSummary).not.toBeNull();
		expect(payload.data.evaluationSummary?.state).toBe(
			CONTEXT_EVALUATION_STATES.GREEN,
		);
		expect(payload.data.evaluationSummary?.metrics).toHaveLength(2);
		expect(payload.data.evaluationSummary?.metrics[0].metric).toBe(
			"document_coverage",
		);
	});

	it("returns null evaluation summary when run has no evaluation yet", async () => {
		vi.spyOn(
			AccountingJobRunsService,
			"getContextEvaluationSummary",
		).mockResolvedValue(null);

		const response = await get(
			"/api/ai-swarm/context-control-plane/runs/run-pending/evaluation?companyId=cmp-1",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.evaluationSummary).toBeNull();
	});
});
