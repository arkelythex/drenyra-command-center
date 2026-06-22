import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Module-level mocks (static, hoisted by Vitest) ──────────────────────────

vi.mock("../../config/openrouter.config", () => ({
	hasOpenRouterKey: () => true,
}));

vi.mock("../../workflows/complete-invoice-processing.workflow", () => ({
	CompleteInvoiceProcessingWorkflow: class {
		async execute() {
			return {
				totalProcessed: 1,
				totalSuccess: 1,
				totalFailed: 0,
				results: [],
				execution: {
					parallelized: false,
					batchSize: 1,
					totalCostUsd: 0,
					totalDurationMs: 10,
					agentsUsed: ["ocr", "sunat", "pcge", "evidence"],
				},
			};
		}
	},
}));

vi.mock("../../workflows/multi-ruc-processing.workflow", () => ({
	MultiRucProcessingWorkflow: class {
		async execute() {
			return {
				totalCompanies: 1,
				totalDocuments: 1,
				successfulCompanies: 1,
				failedCompanies: 0,
				results: [],
				execution: {
					parallelized: true,
					totalCostUsd: 0,
					totalDurationMs: 10,
					averageCostPerCompany: 0,
					averageTimePerCompany: 10,
				},
			};
		}

		generateReport() {
			return {
				summary: "ok",
				statistics: {
					totalInvoicesProcessed: 1,
					totalCost: 0,
					averageCostPerInvoice: 0,
					processingTime: "0.01s",
					successRate: 1,
				},
				byCompany: [],
			};
		}
	},
}));

// Mock Mastra workflow (imported at routes.ts top level)
vi.mock("../../workflows/mastra-invoice-processing.workflow", () => ({
	mastraInvoiceProcessingWorkflow: {
		createRun: vi.fn().mockResolvedValue({
			runId: "mock-run-1",
			workflowId: "mock-workflow-1",
			start: vi.fn().mockResolvedValue({
				status: "success",
				result: {
					decision: "approved",
					reason: "Invoice validated successfully",
					confidence: 0.98,
					validation: { isValid: true, errors: [] },
				},
			}),
			watch: vi.fn(() => () => {}),
		}),
	},
	mapWorkflowStepToAgent: (_stepId: string) => null,
	DEFAULT_MASTRA_INVOICE_INPUT: {
		documentId: "mock-doc",
		filename: "mock.pdf",
		mimeType: "application/pdf",
		ruc: "20100070970",
		serie: "F001",
		numero: "1",
		fecha: "2026-02-18",
		moneda: "PEN" as const,
		subtotal: 100,
		igv: 18,
		total: 118,
	},
}));

// Mock SIRE services (instantiated at routes.ts top level: lines 114-115)
vi.mock("../../workflows/sire-readiness-subagents.service", () => ({
	SireReadinessSubagentsService: class {
		async run() {
			return {
				igvCheck: { compliant: true },
				rvieRceCheck: { compliant: true },
			};
		}
	},
}));

vi.mock("../../workflows/sire-adversarial-audit.service", () => ({
	SireAdversarialAuditService: class {
		async run() {
			return {
				creatorProposal: { score: 0.9 },
				destructorFindings: { score: 0.1 },
				arbiterDecision: { score: 0.85, compliant: true },
			};
		}
	},
}));

const reconcileSuccessFlag = { value: true };

vi.mock("../../agents/reconciliation.agent", () => ({
	ReconciliationAgent: class {
		async reconcile() {
			if (!reconcileSuccessFlag.value) {
				return {
					success: false,
					error: { code: "X", message: "failed reconcile" },
					metadata: {
						agentType: "reconciliation",
						modelUsed: "mock",
						tokensUsed: 0,
						costUsd: 0,
						durationMs: 1,
						timestamp: new Date(),
					},
				};
			}

			return {
				success: true,
				data: {
					matches: [],
					unmatched: { transactions: [], documents: [] },
				},
				metadata: {
					agentType: "reconciliation",
					modelUsed: "mock",
					tokensUsed: 0,
					costUsd: 0,
					durationMs: 1,
					timestamp: new Date(),
				},
			};
		}

		calculateStats() {
			return {
				totalMatches: 0,
				exactMatches: 0,
				partialMatches: 0,
				averageConfidence: 0,
				totalUnmatched: 0,
				matchRate: 1,
			};
		}
	},
}));

// Import routes AFTER all mocks are set up
import { aiSwarmRoutes } from "../../api/routes";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function postJson(path: string, body: unknown): Promise<Response> {
	const app = new Elysia().use(aiSwarmRoutes);
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("AI Swarm Routes Success branches", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "false";
		reconcileSuccessFlag.value = true;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("process-invoices returns success payload when key and governance allow", async () => {
		const response = await postJson("/api/ai-swarm/process-invoices", {
			documents: [
				{
					id: "DOC-100",
					imageUrl: "data:image/png;base64,AA==",
					filename: "invoice.pdf",
					mimeType: "application/pdf",
				},
			],
			priority: "medium",
		});

		const payload = await response.json();
		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.totalProcessed).toBe(1);
		expect(payload.governance.decision).toBe("ALLOW");
	});

	it("multi-ruc-process returns success payload with generated report", async () => {
		const response = await postJson("/api/ai-swarm/multi-ruc-process", {
			companies: [
				{
					ruc: "20100070970",
					companyName: "Demo Co",
					documents: [
						{
							id: "DOC-200",
							imageUrl: "data:image/png;base64,AA==",
							filename: "invoice.pdf",
							mimeType: "application/pdf",
						},
					],
				},
			],
			priority: "medium",
		});

		const payload = await response.json();
		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.report.summary).toBe("ok");
		expect(payload.governance.decision).toBe("ALLOW");
	});

	it("reconcile returns success + stats on agent success", async () => {
		reconcileSuccessFlag.value = true;

		const response = await postJson("/api/ai-swarm/reconcile", {
			priority: "medium",
			transactions: [],
			documents: [],
		});

		const payload = await response.json();
		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.stats).toBeTruthy();
		expect(payload.metadata.agentType).toBe("reconciliation");
	});

	it("reconcile returns 500 when agent returns failure", async () => {
		reconcileSuccessFlag.value = false;

		const response = await postJson("/api/ai-swarm/reconcile", {
			priority: "medium",
			transactions: [],
			documents: [],
		});

		const payload = await response.json();
		expect(response.status).toBe(500);
		expect(payload.success).toBe(false);
		expect(payload.error).toBe("failed reconcile");
	});
});
