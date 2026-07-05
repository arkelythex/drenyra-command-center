/**
 * WorkflowOrchestratorV2 — Session Recovery Tests
 *
 * Validates recoverRun() behavior across all workflow states and error scenarios:
 * - Full restart from IDLE / EXTRACTING
 * - Skip completed phases for PARSING / VALIDATING / ARBITRATING
 * - Error handling for missing, running, or completed runs
 * - Event emission (RECOVERY_STARTED, RECOVERY_COMPLETED, RECOVERY_FAILED)
 * - Non-blocking: orchestrator survives recovery errors
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../src/agents/orchestrator/event.bus";
import { WorkflowOrchestratorV2 } from "../../src/agents/orchestrator/workflow-v2/orchestrator";
import type {
	ExtractedData,
	InvoiceData,
	ParsedInvoice,
	ReaderInput,
	ValidationResult,
} from "../../src/agents/types";
import type {
	AgentRunState,
	AgentRunStatus,
	AgentWorkflowState,
	StateSnapshot,
} from "../../src/session/session.types";
import {
	SessionNotFoundError,
	SessionStoreError,
} from "../../src/session/session.types";
import type { SessionStore } from "../../src/session/session-store";

// ============================================================================
// Test Fixtures
// ============================================================================

function makeInvoiceData(overrides: Partial<InvoiceData> = {}): InvoiceData {
	return {
		invoiceNumber: "F001-123",
		invoiceType: "01",
		issuerRuc: "20123456789",
		issuerName: "Mock S.A.C.",
		customerRuc: "10123456789",
		customerName: "Mock Customer",
		customerDocType: "1",
		issueDate: new Date("2026-06-15"),
		total: 1180.0,
		subtotal: 1000.0,
		igv: 180.0,
		currency: "PEN",
		items: [],
		series: "F001",
		correlative: "123",
		...overrides,
	};
}

function makeExtractedData(): ExtractedData {
	return {
		extractedData: makeInvoiceData(),
		confidence: 0.95,
		flags: [],
		processingTime: 100,
		agentId: "mock-reader",
	};
}

function makeParsedInvoice(): ParsedInvoice {
	return {
		parsedData: makeInvoiceData(),
		schemaVersion: "UBL_2.1",
		discrepancies: [],
		needsMigration: false,
		processingTime: 80,
		agentId: "mock-parser",
	};
}

function makeValidationResult(): ValidationResult {
	return {
		isCompliant: true,
		violations: [],
		suggestedFixes: [],
		generatedXML: "<xml>mock</xml>",
		processingTime: 120,
		agentId: "mock-validator",
	};
}

function makeReaderInput(overrides: Partial<ReaderInput> = {}): ReaderInput {
	return {
		type: "invoice_xml",
		data: "<xml>test</xml>",
		metadata: {
			ruc: "20123456789",
			fileName: "test.xml",
		},
		...overrides,
	};
}

function makeStateSnapshot(overrides?: {
	workflowState?: AgentWorkflowState;
	status?: AgentRunStatus;
	context?: Record<string, unknown>;
}): StateSnapshot {
	return {
		state: {
			id: "uuid-1",
			runId: "test-run-id",
			sessionId: null,
			workflowState: overrides?.workflowState ?? ("IDLE" as AgentWorkflowState),
			agentMetrics: null,
			context: (overrides?.context ?? {}) as Record<string, unknown> | null,
			status: overrides?.status ?? ("failed" as AgentRunStatus),
			error: "Previous failure",
			companyId: "company-uuid",
			startedAt: new Date("2026-06-15T10:00:00Z"),
			completedAt: null,
			createdAt: new Date("2026-06-15T10:00:00Z"),
			updatedAt: new Date("2026-06-15T10:05:00Z"),
		},
		events: [],
	};
}

// ============================================================================
// Mock Agent Factories
// ============================================================================

function createMockReaderAgent() {
	return {
		id: "mock-reader",
		role: "reader" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue(makeExtractedData()),
	};
}

function createMockParserAgent() {
	return {
		id: "mock-parser",
		role: "parser" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue(makeParsedInvoice()),
	};
}

function createMockValidatorAgent() {
	return {
		id: "mock-validator",
		role: "validator" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue(makeValidationResult()),
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
			finalData: makeInvoiceData(),
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

// ============================================================================
// Mock SessionStore
// ============================================================================

function createMockSessionStore() {
	return {
		saveRunState: vi.fn().mockResolvedValue(undefined),
		getRunState: vi.fn(),
		listRunStates: vi.fn(),
		appendEvent: vi.fn().mockResolvedValue(undefined),
		getEvents: vi.fn(),
		updateRunState: vi.fn(),
		recoverRunState: vi.fn(),
		saveInput: vi.fn().mockResolvedValue(undefined),
		getInput: vi.fn(),
	} satisfies SessionStore;
}

type MockSessionStore = ReturnType<typeof createMockSessionStore>;

// ============================================================================
// Tests
// ============================================================================

describe("WorkflowOrchestratorV2 → recoverRun", () => {
	let orchestrator: WorkflowOrchestratorV2;
	let eventBus: EventBus;
	let emitSpy: ReturnType<typeof vi.spyOn>;

	let mockReader: ReturnType<typeof createMockReaderAgent>;
	let mockParser: ReturnType<typeof createMockParserAgent>;
	let mockValidator: ReturnType<typeof createMockValidatorAgent>;
	let mockArbitrator: ReturnType<typeof createMockArbitratorAgent>;
	let mockSessionStore: MockSessionStore;

	const defaultInput = makeReaderInput();

	beforeEach(() => {
		mockReader = createMockReaderAgent();
		mockParser = createMockParserAgent();
		mockValidator = createMockValidatorAgent();
		mockArbitrator = createMockArbitratorAgent();
		mockSessionStore = createMockSessionStore();
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
				sessionStore: mockSessionStore as unknown as SessionStore,
			},
			eventBus,
		);

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// -----------------------------------------------------------------------
	// State-based recovery routing
	// -----------------------------------------------------------------------

	describe("state routing", () => {
		it("should recover from IDLE with a full restart (processInvoice)", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "IDLE" }),
			);

			const context = await orchestrator.recoverRun(
				"test-run-id",
				defaultInput,
			);

			expect(context).toBeDefined();
			expect(context.processId).toBe("test-run-id");

			// processInvoice must have been called (all agents run)
			expect(mockReader.process).toHaveBeenCalled();
			expect(mockParser.process).toHaveBeenCalled();
			expect(mockValidator.process).toHaveBeenCalled();
		});

		it("should recover from EXTRACTING with a full restart (processInvoice)", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "EXTRACTING" }),
			);

			const context = await orchestrator.recoverRun(
				"test-run-id",
				defaultInput,
			);

			expect(context).toBeDefined();
			expect(context.processId).toBe("test-run-id");

			// EXTRACTING also maps to full restart
			expect(mockReader.process).toHaveBeenCalled();
			expect(mockParser.process).toHaveBeenCalled();
			expect(mockValidator.process).toHaveBeenCalled();
		});

		it("should recover from PARSING by skipping reader and resuming from parser", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({
					workflowState: "PARSING",
					context: { extractedData: makeExtractedData() },
				}),
			);

			const context = await orchestrator.recoverRun(
				"test-run-id",
				defaultInput,
			);

			expect(context).toBeDefined();
			expect(context.processId).toBe("test-run-id");

			// Reader should be skipped (prebuilt data used instead)
			expect(mockReader.process).not.toHaveBeenCalled();
			// Parser and validator should still run
			expect(mockParser.process).toHaveBeenCalled();
			expect(mockValidator.process).toHaveBeenCalled();
		});

		it("should recover from VALIDATING by skipping reader and parser", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({
					workflowState: "VALIDATING",
					context: {
						extractedData: makeExtractedData(),
						parsedData: makeParsedInvoice(),
					},
				}),
			);

			const context = await orchestrator.recoverRun(
				"test-run-id",
				defaultInput,
			);

			expect(context).toBeDefined();
			expect(context.processId).toBe("test-run-id");

			// Reader and parser skipped
			expect(mockReader.process).not.toHaveBeenCalled();
			expect(mockParser.process).not.toHaveBeenCalled();
			// Validator should still run
			expect(mockValidator.process).toHaveBeenCalled();
		});

		it("should recover from ARBITRATING by skipping all agent phases", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({
					workflowState: "ARBITRATING",
					context: {
						extractedData: makeExtractedData(),
						parsedData: makeParsedInvoice(),
						validationResult: makeValidationResult(),
					},
				}),
			);

			const context = await orchestrator.recoverRun(
				"test-run-id",
				defaultInput,
			);

			expect(context).toBeDefined();
			expect(context.processId).toBe("test-run-id");

			// All agent phases should be skipped
			expect(mockReader.process).not.toHaveBeenCalled();
			expect(mockParser.process).not.toHaveBeenCalled();
			expect(mockValidator.process).not.toHaveBeenCalled();
		});
	});

	// -----------------------------------------------------------------------
	// Error handling
	// -----------------------------------------------------------------------

	describe("error handling", () => {
		it("should throw SessionNotFoundError when no persisted state exists", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(null);

			await expect(
				orchestrator.recoverRun("nonexistent-run", defaultInput),
			).rejects.toThrow(SessionNotFoundError);
		});

		it("should throw SessionStoreError when the run is still running", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "EXTRACTING", status: "running" }),
			);

			await expect(
				orchestrator.recoverRun("running-run", defaultInput),
			).rejects.toThrow(SessionStoreError);

			await expect(
				orchestrator.recoverRun("running-run", defaultInput),
			).rejects.toThrow(/still active/);
		});

		it("should throw SessionStoreError when the run is already completed", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "COMPLETED", status: "completed" }),
			);

			await expect(
				orchestrator.recoverRun("completed-run", defaultInput),
			).rejects.toThrow(SessionStoreError);

			await expect(
				orchestrator.recoverRun("completed-run", defaultInput),
			).rejects.toThrow(/already completed/);
		});

		it("should throw SessionStoreError when sessionStore is not configured", async () => {
			const noStoreOrch = new WorkflowOrchestratorV2(
				createMockReaderAgent() as never,
				createMockParserAgent() as never,
				createMockValidatorAgent() as never,
				createMockArbitratorAgent() as never,
				{
					agentTimeoutMs: 5000,
					maxRetries: 0,
					enableCircuitBreaker: false,
					enableMetrics: false,
					// no sessionStore
				},
				new EventBus(),
			);

			await expect(
				noStoreOrch.recoverRun("any-run", defaultInput),
			).rejects.toThrow(SessionStoreError);

			await expect(
				noStoreOrch.recoverRun("any-run", defaultInput),
			).rejects.toThrow(/not configured/);
		});
	});

	// -----------------------------------------------------------------------
	// Event emission
	// -----------------------------------------------------------------------

	describe("event emission", () => {
		it("should emit RECOVERY_STARTED when recovery begins", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "IDLE" }),
			);

			await orchestrator.recoverRun("test-run-id", defaultInput);

			const startedEvents = emitSpy.mock.calls.filter(
				([event]) => (event as { type: string }).type === "RECOVERY_STARTED",
			);
			expect(startedEvents.length).toBe(1);
			const payload = startedEvents[0][0] as Record<string, unknown>;
			expect(payload.processId).toBe("test-run-id");
			expect(payload.workflowState).toBe("IDLE");
		});

		it("should emit RECOVERY_COMPLETED on successful recovery", async () => {
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "IDLE" }),
			);

			await orchestrator.recoverRun("test-run-id", defaultInput);

			const completedEvents = emitSpy.mock.calls.filter(
				([event]) => (event as { type: string }).type === "RECOVERY_COMPLETED",
			);
			expect(completedEvents.length).toBe(1);
			const payload = completedEvents[0][0] as Record<string, unknown>;
			expect(payload.processId).toBe("test-run-id");
			expect(payload.duration).toEqual(expect.any(Number));
		});
	});

	// -----------------------------------------------------------------------
	// Non-blocking: recovery error does not break the orchestrator
	// -----------------------------------------------------------------------

	describe("non-blocking behavior", () => {
		it("should emit RECOVERY_FAILED and re-throw when recovery validation fails inside the try block", async () => {
			// PARSING recovery requires extractedData in context — omit it to trigger a throw
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({
					workflowState: "PARSING",
					// no context.extractedData — will throw inside the try block
					context: {},
				}),
			);

			await expect(
				orchestrator.recoverRun("test-run-id", defaultInput),
			).rejects.toThrow(SessionStoreError);

			// RECOVERY_FAILED must have been emitted before re-throwing
			const failedEvents = emitSpy.mock.calls.filter(
				([event]) => (event as { type: string }).type === "RECOVERY_FAILED",
			);
			expect(failedEvents.length).toBe(1);
		});

		it("should remain functional after a recoverRun error", async () => {
			// recoverRun throws because the run is still running
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "EXTRACTING", status: "running" }),
			);

			await expect(
				orchestrator.recoverRun("failing-run", defaultInput),
			).rejects.toThrow(SessionStoreError);

			// Orchestrator should still handle a fresh processInvoice
			mockSessionStore.recoverRunState.mockResolvedValue(
				makeStateSnapshot({ workflowState: "IDLE", status: "failed" }),
			);

			const context = await orchestrator.recoverRun("second-run", defaultInput);
			expect(context).toBeDefined();
			expect(context.processId).toBe("second-run");
		});
	});
});
