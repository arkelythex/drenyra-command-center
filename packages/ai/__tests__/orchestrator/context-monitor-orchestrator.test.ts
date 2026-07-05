/**
 * ContextMonitor — Orchestrator Integration Tests
 *
 * Verifies that WorkflowOrchestratorV2 correctly wires ContextMonitor:
 * - checkContextThreshold() called during processInvoice()
 * - PRUNE_REQUESTED emitted when threshold crossed
 * - No prune_requested when context under threshold
 * - No-op when no contextMonitor configured
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../src/agents/orchestrator/event.bus";
import { WorkflowOrchestratorV2 } from "../../src/agents/orchestrator/workflow-v2/orchestrator";
import type { InvoiceData, ReaderInput } from "../../src/agents/types";
import type { ContextMonitor } from "../../src/context-monitor/context-monitor";

// ---------------------------------------------------------------------------
// Mock agent factories
// ---------------------------------------------------------------------------

function createMockInvoiceData(
	overrides: Partial<InvoiceData> = {},
): InvoiceData {
	return {
		invoiceNumber: "F001-123",
		invoiceType: "01",
		issuerRuc: "20123456789",
		issuerName: "Mock S.A.C.",
		customerRuc: "10123456789",
		customerName: "Mock Customer",
		customerDocType: "1",
		issueDate: "2026-01-15",
		total: 1180.0,
		subtotal: 1000.0,
		igv: 180.0,
		currency: "PEN",
		lineItems: [],
		...overrides,
	};
}

function createMockReaderAgent() {
	return {
		id: "mock-reader",
		role: "reader" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue({
			extractedData: createMockInvoiceData(),
			confidence: 0.95,
			flags: [],
			processingTime: 100,
			agentId: "mock-reader",
		}),
	};
}

function createMockParserAgent() {
	return {
		id: "mock-parser",
		role: "parser" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue({
			parsedData: createMockInvoiceData(),
			schemaVersion: "UBL_2.1",
			discrepancies: [],
			needsMigration: false,
			processingTime: 80,
			agentId: "mock-parser",
		}),
	};
}

function createMockValidatorAgent() {
	return {
		id: "mock-validator",
		role: "validator" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue({
			isCompliant: true,
			violations: [],
			suggestedFixes: [],
			generatedXML: "<xml>mock</xml>",
			processingTime: 120,
			agentId: "mock-validator",
		}),
	};
}

function createMockArbitratorAgent() {
	return {
		id: "mock-arbitrator",
		role: "arbitrator" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue({
			requiresManualReview: false,
			decision: "APPROVED",
			finalData: createMockInvoiceData(),
			arbitrationLog: {
				conflicts: [],
				resolutions: [],
				timestamp: new Date(),
				arbitratorModel: "mock",
			},
			confidence: 0.95,
			processingTime: 50,
		}),
	};
}

function createMockContextMonitor(): ContextMonitor {
	return {
		trackRequest: vi.fn(),
		shouldPrune: vi.fn().mockReturnValue(false),
		getRunUsage: vi.fn().mockReturnValue(null),
		resetRun: vi.fn(),
	} as unknown as ContextMonitor;
}

function createReaderInput(overrides: Partial<ReaderInput> = {}): ReaderInput {
	return {
		type: "invoice_xml",
		data: "<xml>test</xml>",
		metadata: {
			ruc: "20123456789",
			invoiceType: "01",
			invoiceNumber: "F001-123",
			fileName: "test.xml",
		},
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WorkflowOrchestratorV2 → ContextMonitor Integration", () => {
	let monitor: ContextMonitor;
	let orchestrator: WorkflowOrchestratorV2;
	let eventBus: EventBus;
	let emitSpy: ReturnType<typeof vi.spyOn>;

	const mockReader = createMockReaderAgent();
	const mockParser = createMockParserAgent();
	const mockValidator = createMockValidatorAgent();
	const mockArbitrator = createMockArbitratorAgent();

	beforeEach(() => {
		monitor = createMockContextMonitor();
		eventBus = new EventBus();
		emitSpy = vi.spyOn(eventBus, "emit");

		orchestrator = new WorkflowOrchestratorV2(
			mockReader as never,
			mockParser as never,
			mockValidator as never,
			mockArbitrator as never,
			{
				agentTimeoutMs: 5000,
				maxRetries: 0,
				enableCircuitBreaker: false,
				enableMetrics: false,
				contextMonitor: monitor,
			},
			eventBus,
		);

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("checkContextThreshold wiring", () => {
		it("should call shouldPrune during processInvoice when contextMonitor is configured", async () => {
			vi.spyOn(monitor, "shouldPrune").mockReturnValue(false);

			await orchestrator.processInvoice(createReaderInput());

			// shouldPrune should be called at least once during the workflow
			expect(monitor.shouldPrune).toHaveBeenCalled();
		});

		it("should emit prune_requested event when threshold is crossed", async () => {
			vi.spyOn(monitor, "shouldPrune").mockReturnValue(true);
			vi.spyOn(monitor, "getRunUsage").mockReturnValue({
				runId: "test-run",
				totalTokens: 190000,
				modelContextWindow: 200000,
				usageRatio: 0.95,
				lastUpdated: new Date(),
			});

			await orchestrator.processInvoice(createReaderInput());

			// prune_requested event should be emitted
			const pruneEvents = emitSpy.mock.calls.filter(
				([event]) => (event as { type: string }).type === "PRUNE_REQUESTED",
			);
			expect(pruneEvents.length).toBeGreaterThan(0);
		});

		it("should NOT emit prune_requested when usage is under threshold", async () => {
			vi.spyOn(monitor, "shouldPrune").mockReturnValue(false);

			await orchestrator.processInvoice(createReaderInput());

			const pruneEvents = emitSpy.mock.calls.filter(
				([event]) => (event as { type: string }).type === "PRUNE_REQUESTED",
			);
			expect(pruneEvents).toHaveLength(0);
		});

		it("should emit prune_requested at most once per run (dedup)", async () => {
			// First call returns true (crossing threshold), subsequent calls false
			const shouldPruneSpy = vi.spyOn(monitor, "shouldPrune");
			shouldPruneSpy.mockReturnValueOnce(true).mockReturnValue(false);
			vi.spyOn(monitor, "getRunUsage").mockReturnValue({
				runId: "test-run",
				totalTokens: 190000,
				modelContextWindow: 200000,
				usageRatio: 0.95,
				lastUpdated: new Date(),
			});

			await orchestrator.processInvoice(createReaderInput());

			const pruneEvents = emitSpy.mock.calls.filter(
				([event]) => (event as { type: string }).type === "PRUNE_REQUESTED",
			);
			expect(pruneEvents).toHaveLength(1);
		});
	});

	describe("no contextMonitor configured", () => {
		it("should process without error when no contextMonitor", async () => {
			const orch = new WorkflowOrchestratorV2(
				createMockReaderAgent() as never,
				createMockParserAgent() as never,
				createMockValidatorAgent() as never,
				createMockArbitratorAgent() as never,
				{
					agentTimeoutMs: 5000,
					maxRetries: 0,
					enableCircuitBreaker: false,
					enableMetrics: false,
				},
				new EventBus(),
			);

			await orch.processInvoice(createReaderInput());

			// Should complete without error
			expect(true).toBe(true);
		});
	});

	describe("non-blocking behavior", () => {
		it("should NOT throw when shouldPrune throws", async () => {
			vi.spyOn(monitor, "shouldPrune").mockImplementation(() => {
				throw new Error("DB connection lost");
			});

			const result = await orchestrator.processInvoice(createReaderInput());

			expect(result.status).toBe("success");
		});

		it("should NOT throw when getRunUsage throws", async () => {
			vi.spyOn(monitor, "shouldPrune").mockReturnValue(true);
			vi.spyOn(monitor, "getRunUsage").mockImplementation(() => {
				throw new Error("Unexpected error");
			});

			const result = await orchestrator.processInvoice(createReaderInput());

			expect(result.status).toBe("success");
		});
	});

	describe("event payload", () => {
		it("should include usage and threshold in prune_requested event", async () => {
			vi.spyOn(monitor, "shouldPrune").mockReturnValue(true);
			vi.spyOn(monitor, "getRunUsage").mockReturnValue({
				runId: "test-run",
				totalTokens: 190000,
				modelContextWindow: 200000,
				usageRatio: 0.95,
				lastUpdated: new Date(),
			});

			await orchestrator.processInvoice(createReaderInput());

			const pruneEvent = emitSpy.mock.calls.find(
				([event]) => (event as { type: string }).type === "PRUNE_REQUESTED",
			)?.[0] as Record<string, unknown> | undefined;

			expect(pruneEvent).toBeDefined();
			expect(pruneEvent).toHaveProperty("usage");
			expect(pruneEvent).toHaveProperty("threshold");
		});
	});
});
