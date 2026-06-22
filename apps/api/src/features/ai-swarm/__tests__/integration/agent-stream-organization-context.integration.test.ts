import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Module-level mocks (static, hoisted by Vitest) ──────────────────────────

const triggerWorkflowConsensusAlertMock = vi.fn(
	async (_result: unknown, organizationId: number) => ({
		alertId: `alert-org-${organizationId}`,
		consensusScore: 0.96,
		threshold: 0.95,
		shouldTriggerAlert: true,
		severity: "high" as const,
	}),
);

const mockWatchCallbacks: ((event: {
	type: string;
	payload: { id: string; status: string };
}) => void)[] = [];

const mockRun = {
	runId: "mock-run-1",
	workflowId: "mock-workflow-1",
	start: vi.fn().mockResolvedValue({
		status: "success",
		result: {
			decision: "rejected",
			reason: "Invoice validation failed",
			confidence: 0.96,
			validation: { isValid: false, errors: [] },
		},
	}),
	watch: vi.fn(
		(
			callback: (event: {
				type: string;
				payload: { id: string; status: string };
			}) => void,
		) => {
			mockWatchCallbacks.push(callback);
			// Emit events synchronously after a microtask
			queueMicrotask(() => {
				callback({
					type: "workflow-step-start",
					payload: { id: "lector", status: "running" },
				});
				callback({
					type: "workflow-step-result",
					payload: { id: "lector", status: "success" },
				});
				callback({
					type: "workflow-step-finish",
					payload: { id: "lector", status: "success" },
				});
				callback({
					type: "workflow-step-start",
					payload: { id: "validador", status: "running" },
				});
				callback({
					type: "workflow-step-result",
					payload: { id: "validador", status: "success" },
				});
				callback({
					type: "workflow-step-finish",
					payload: { id: "validador", status: "success" },
				});
				callback({
					type: "workflow-step-start",
					payload: { id: "arbitro", status: "running" },
				});
				callback({
					type: "workflow-step-result",
					payload: { id: "arbitro", status: "success" },
				});
				callback({
					type: "workflow-step-finish",
					payload: { id: "arbitro", status: "success" },
				});
			});
			return () => {
				const idx = mockWatchCallbacks.indexOf(callback);
				if (idx !== -1) mockWatchCallbacks.splice(idx, 1);
			};
		},
	),
};

vi.mock("../../alerts/workflow-alert-trigger", () => ({
	triggerWorkflowConsensusAlert: triggerWorkflowConsensusAlertMock,
}));

vi.mock("../../workflows/mastra-invoice-processing.workflow", () => ({
	mastraInvoiceProcessingWorkflow: {
		createRun: vi.fn().mockResolvedValue(mockRun),
	},
	mapWorkflowStepToAgent: (stepId: string) => {
		const map: Record<string, string | null> = {
			lector: "lector",
			validador: "validador",
			arbitro: "arbitro",
		};
		return map[stepId] ?? null;
	},
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

// Import routes AFTER mocks are set up (static import, hoisted by Vitest)
import { aiSwarmRoutes } from "../../api/routes";

// ── Helpers ─────────────────────────────────────────────────────────────────

interface ParsedSseEvent {
	event: string;
	data: unknown;
}

function parseSsePayload(payload: string): ParsedSseEvent[] {
	const events: ParsedSseEvent[] = [];
	let currentEvent = "";
	let currentData = "";

	const flush = () => {
		if (!currentEvent || !currentData) return;
		try {
			events.push({ event: currentEvent, data: JSON.parse(currentData) });
		} catch {
			events.push({ event: currentEvent, data: currentData });
		}
		currentEvent = "";
		currentData = "";
	};

	for (const line of payload.split("\n")) {
		if (line.startsWith("event: ")) {
			currentEvent = line.slice("event: ".length).trim();
			continue;
		}
		if (line.startsWith("data: ")) {
			currentData = line.slice("data: ".length).trim();
			continue;
		}
		if (line.trim() === "") flush();
	}

	flush();
	return events;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("AI Swarm agent-stream organization context", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		triggerWorkflowConsensusAlertMock.mockClear();
		mockRun.start.mockClear();
		mockRun.watch.mockClear();
		mockWatchCallbacks.length = 0;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("passes x-organization-id to workflow consensus trigger for non-approved workflows", async () => {
		const app = new Elysia().use(aiSwarmRoutes);
		const response = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/agent-stream?documentId=DOC-ORG-001&ruc=20100070970&serie=F001&numero=1&fecha=2026-02-18&moneda=PEN&subtotal=100&igv=40&total=140",
				{
					headers: {
						"x-organization-id": "42",
					},
				},
			),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");

		const rawSse = await response.text();
		const events = parseSsePayload(rawSse);

		expect(triggerWorkflowConsensusAlertMock).toHaveBeenCalledTimes(1);
		expect(triggerWorkflowConsensusAlertMock.mock.calls[0]?.[1]).toBe(42);

		const workflowCompleteEvent = events.find(
			(event) => event.event === "workflow-complete",
		);
		expect(workflowCompleteEvent).toBeTruthy();

		// Verify anomaly-alert is emitted in the SSE stream (fix: await before close()).
		const anomalyAlertEvent = events.find(
			(event) => event.event === "anomaly-alert",
		);
		expect(anomalyAlertEvent).toBeTruthy();
		expect((anomalyAlertEvent?.data as Record<string, unknown>)?.severity).toBe(
			"high",
		);
		expect(
			(anomalyAlertEvent?.data as Record<string, unknown>)?.consensusScore,
		).toBe(0.96);
	});

	it("accepts orgId query param when headers are not available", async () => {
		const app = new Elysia().use(aiSwarmRoutes);
		const response = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/agent-stream?orgId=73&documentId=DOC-ORG-002&ruc=20100070970&serie=F001&numero=2&fecha=2026-02-18&moneda=PEN&subtotal=100&igv=40&total=140",
			),
		);

		expect(response.status).toBe(200);
		await response.text();

		expect(triggerWorkflowConsensusAlertMock).toHaveBeenCalledTimes(1);
		expect(triggerWorkflowConsensusAlertMock.mock.calls[0]?.[1]).toBe(73);
	});

	it("skips consensus alert when organization context is missing", async () => {
		delete process.env.AI_SWARM_DEFAULT_ORG_ID;

		const app = new Elysia().use(aiSwarmRoutes);
		const response = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/agent-stream?documentId=DOC-ORG-003&ruc=20100070970&serie=F001&numero=3&fecha=2026-02-18&moneda=PEN&subtotal=100&igv=40&total=140",
			),
		);

		expect(response.status).toBe(200);
		const rawSse = await response.text();
		const events = parseSsePayload(rawSse);

		expect(triggerWorkflowConsensusAlertMock).not.toHaveBeenCalled();
		expect(
			events.some((event) => event.event === "anomaly-alert-skipped"),
		).toBe(true);
	});
});
