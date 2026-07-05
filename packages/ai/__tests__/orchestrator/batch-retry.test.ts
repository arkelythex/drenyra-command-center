/**
 * Batch/Retry Integration Tests
 *
 * Tests the integration between BatchOrchestrator, WorkflowOrchestratorV2,
 * RetryEngine, and PersistentCircuitBreaker.
 *
 * @module __tests__/orchestrator
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────
const {
	mockEnqueueForRetry,
	mockExecuteWithRetry,
	mockIsAvailable,
	mockRecordSuccess,
	mockRecordFailure,
} = vi.hoisted(() => ({
	mockEnqueueForRetry: vi.fn(),
	mockExecuteWithRetry: vi.fn(),
	mockIsAvailable: vi.fn(),
	mockRecordSuccess: vi.fn(),
	mockRecordFailure: vi.fn(),
}));

// Mock @drenyra/infrastructure/services/error-recovery for RetryEngine/PersistentCircuitBreaker
vi.mock("@drenyra/infrastructure/services/error-recovery", () => ({
	dlqRepo: {
		enqueue: vi.fn(),
		dequeue: vi.fn(),
		markResolved: vi.fn(),
		markDead: vi.fn(),
		incrementRetry: vi.fn(),
		listByStatus: vi.fn(),
		countByStatus: vi.fn(),
	},
	circuitBreakerRepo: {
		getState: vi.fn(),
		upsertState: vi.fn(),
	},
}));

// ─── Imports after mocks ────────────────────────────────────────────────────
import { BatchOrchestrator } from "../../src/agents/orchestrator/batch/batch-orchestrator";
import type { WorkflowOrchestratorV2 as WorkflowOrchestratorV2Type } from "../../src/agents/orchestrator/workflow-v2";
import { WorkflowOrchestratorV2 } from "../../src/agents/orchestrator/workflow-v2/orchestrator";
import type { AgentError } from "../../src/services/error-recovery/agent-error";
import type { SessionStore } from "../../src/session/session-store";

// ─── Factories ───────────────────────────────────────────────────────────────

function createMockSessionStore(): SessionStore {
	return {
		addBatchItem: vi.fn(),
		getBatchItems: vi.fn().mockResolvedValue([
			{ id: "item-1", status: "pending" },
			{ id: "item-2", status: "pending" },
		]),
		updateBatchItem: vi.fn(),
		updateBatchProgress: vi.fn(),
		getBatch: vi.fn().mockResolvedValue({ total: 2, completed: 1, failed: 0 }),
		appendEvent: vi.fn(),
		saveRunState: vi.fn(),
		saveInput: vi.fn(),
		recoverRunState: vi.fn(),
	} as unknown as SessionStore;
}

function createMockRetryEngine() {
	return {
		enqueueForRetry: mockEnqueueForRetry,
		executeWithRetry: mockExecuteWithRetry,
		processPendingItems: vi.fn(),
		processPendingRetries: vi.fn(),
	} as unknown as import("../../src/services/error-recovery").RetryEngine;
}

function createMockPersistentCircuitBreaker() {
	return {
		isAvailable: mockIsAvailable,
		recordSuccess: mockRecordSuccess,
		recordFailure: mockRecordFailure,
		getState: vi.fn().mockReturnValue("CLOSED"),
	} as unknown as import("../../src/services/error-recovery").PersistentCircuitBreaker;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("BatchOrchestrator — RetryEngine integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEnqueueForRetry.mockResolvedValue(undefined);
	});

	it("1. batch item failure enqueues to DLQ", async () => {
		// Setup: orchestrator factory throws
		const mockCreateOrch = vi.fn().mockImplementation(() => {
			throw new Error("timeout: provider unavailable");
		});
		const mockStore = createMockSessionStore();
		const mockRetry = createMockRetryEngine();

		const orchestrator = new BatchOrchestrator(mockStore, mockCreateOrch, {
			maxConcurrent: 1,
			enablePersistence: false,
			retryEngine: mockRetry,
		});

		const result = await orchestrator.runBatch({
			batchId: "batch-1",
			companyId: "company-1",
			inputs: [{ type: "invoice_image", data: "test-data", metadata: {} }],
		});

		expect(result.items[0].status).toBe("failed");
		expect(mockEnqueueForRetry).toHaveBeenCalledTimes(1);
		expect(mockEnqueueForRetry).toHaveBeenCalledWith(
			expect.any(String),
			"invoice-processor",
			expect.objectContaining({ type: "TRANSIENT", retryable: true }),
			undefined,
			"batch-1",
			{ inputType: "invoice_image" },
		);
	});

	it("2. successful batch items are NOT enqueued to DLQ", async () => {
		const mockCreateOrch = vi.fn().mockReturnValue({
			processInvoice: vi.fn().mockResolvedValue({
				status: "success",
				invoiceData: {},
				processingLog: {},
			}),
		});
		const mockStore = createMockSessionStore();
		const mockRetry = createMockRetryEngine();

		const orchestrator = new BatchOrchestrator(mockStore, mockCreateOrch, {
			maxConcurrent: 1,
			enablePersistence: false,
			retryEngine: mockRetry,
		});

		const result = await orchestrator.runBatch({
			batchId: "batch-2",
			companyId: "company-1",
			inputs: [{ type: "invoice_image", data: "test-data", metadata: {} }],
		});

		expect(result.items[0].status).toBe("completed");
		expect(mockEnqueueForRetry).not.toHaveBeenCalled();
	});

	it("3. retryEngine.enqueueForRetry called per failed item", async () => {
		let callCount = 0;
		const mockCreateOrch = vi.fn().mockImplementation(() => {
			callCount++;
			if (callCount === 1) throw new Error("timeout: first item");
			return {
				processInvoice: vi.fn().mockResolvedValue({
					status: "success",
					invoiceData: {},
					processingLog: {},
				}),
			};
		});
		const mockStore = createMockSessionStore();
		const mockRetry = createMockRetryEngine();

		const orchestrator = new BatchOrchestrator(mockStore, mockCreateOrch, {
			maxConcurrent: 2,
			enablePersistence: false,
			retryEngine: mockRetry,
		});

		await orchestrator.runBatch({
			batchId: "batch-3",
			companyId: "company-1",
			inputs: [
				{ type: "invoice_image", data: "first", metadata: {} },
				{ type: "invoice_image", data: "second", metadata: {} },
			],
		});

		// Only the failing item should be enqueued
		expect(mockEnqueueForRetry).toHaveBeenCalledTimes(1);
	});

	it("4. batch continues processing after item failure + enqueue", async () => {
		let callCount = 0;
		const mockCreateOrch = vi.fn().mockImplementation(() => {
			callCount++;
			if (callCount === 1) throw new Error("timeout: first item");
			return {
				processInvoice: vi.fn().mockResolvedValue({
					status: "success",
					invoiceData: {},
					processingLog: {},
				}),
			};
		});
		const mockStore = createMockSessionStore();
		const mockRetry = createMockRetryEngine();

		const orchestrator = new BatchOrchestrator(mockStore, mockCreateOrch, {
			maxConcurrent: 2,
			enablePersistence: false,
			retryEngine: mockRetry,
		});

		const result = await orchestrator.runBatch({
			batchId: "batch-4",
			companyId: "company-1",
			inputs: [
				{ type: "invoice_image", data: "first-fail", metadata: {} },
				{ type: "invoice_image", data: "second-ok", metadata: {} },
			],
		});

		expect(result.status).toBe("partial");
		expect(result.completed).toBe(1);
		expect(result.failed).toBe(1);
		expect(result.items[0].status).toBe("failed");
		expect(result.items[1].status).toBe("completed");
		expect(mockEnqueueForRetry).toHaveBeenCalledTimes(1);
	});
});

describe("WorkflowOrchestratorV2 — PersistentCircuitBreaker + RetryEngine", () => {
	let mockReader: { process: ReturnType<typeof vi.fn> };
	let mockParser: { process: ReturnType<typeof vi.fn> };
	let mockValidator: { process: ReturnType<typeof vi.fn> };
	let mockArbitrator: { process: ReturnType<typeof vi.fn> };

	function createMockAgents() {
		mockReader = { process: vi.fn() };
		mockParser = { process: vi.fn() };
		mockValidator = { process: vi.fn() };
		mockArbitrator = { process: vi.fn() };
		return { mockReader, mockParser, mockValidator, mockArbitrator };
	}

	beforeEach(() => {
		vi.clearAllMocks();
		createMockAgents();
		mockIsAvailable.mockResolvedValue(true);
		mockRecordSuccess.mockResolvedValue(undefined);
		mockRecordFailure.mockResolvedValue(undefined);
		mockExecuteWithRetry.mockReset();
	});

	it("5. PersistentCircuitBreaker block stops execution", async () => {
		mockIsAvailable.mockResolvedValue(false);
		const mockCB = createMockPersistentCircuitBreaker();

		const orchestrator = new WorkflowOrchestratorV2(
			mockReader as any,
			mockParser as any,
			mockValidator as any,
			mockArbitrator as any,
			{
				enableCircuitBreaker: true,
				agentTimeoutMs: 5000,
				maxRetries: 0,
				enableMetrics: false,
				persistentCircuitBreaker: mockCB,
			},
		);

		const result = await orchestrator.processInvoice({
			type: "invoice_image",
			data: "test",
			metadata: {},
		});

		expect(result.status).toBe("failed");
		// Reader should never have been called since CB blocked
		expect(mockReader.process).not.toHaveBeenCalled();
	});

	it("6. executeAgentWithRetry succeeds on first try", async () => {
		mockReader.process.mockResolvedValue({
			extractedData: { total: 100, invoiceNumber: "F001-1" },
			confidence: 0.95,
			flags: [],
			processingTime: 100,
			agentId: "reader",
		});

		// Parser and validator must also succeed for the full pipeline
		mockParser.process.mockResolvedValue({
			parsedData: { total: 100, invoiceNumber: "F001-1" },
			schemaVersion: "UBL_2.1",
			discrepancies: [],
			needsMigration: false,
			processingTime: 50,
			agentId: "parser",
		});
		mockValidator.process.mockResolvedValue({
			isCompliant: true,
			violations: [],
			processingTime: 50,
			agentId: "validator",
		});

		const mockRetry = createMockRetryEngine();
		// Simulate first-try success
		mockExecuteWithRetry.mockImplementation(
			async (fn: () => Promise<unknown>) => {
				const result = await fn();
				return { result, retries: 0 };
			},
		);

		const orchestrator = new WorkflowOrchestratorV2(
			mockReader as any,
			mockParser as any,
			mockValidator as any,
			mockArbitrator as any,
			{
				enableCircuitBreaker: false,
				enableMetrics: false,
				agentTimeoutMs: 5000,
				maxRetries: 0,
				retryEngine: mockRetry,
			},
		);

		const result = await orchestrator.processInvoice({
			type: "invoice_image",
			data: "test",
			metadata: {},
		});

		expect(result.status).toBe("success");
	});

	it("7. executeAgentWithRetry retries transient error", async () => {
		const transientError = new Error("timeout: provider busy");
		let readerCallCount = 0;

		mockReader.process.mockImplementation(() => {
			readerCallCount++;
			if (readerCallCount === 1) throw transientError;
			return {
				extractedData: { total: 100, invoiceNumber: "F001-1" },
				confidence: 0.95,
				flags: [],
				processingTime: 100,
				agentId: "reader",
			};
		});

		mockParser.process.mockResolvedValue({
			parsedData: { total: 100, invoiceNumber: "F001-1" },
			schemaVersion: "UBL_2.1",
			discrepancies: [],
			needsMigration: false,
			processingTime: 50,
			agentId: "parser",
		});
		mockValidator.process.mockResolvedValue({
			isCompliant: true,
			violations: [],
			processingTime: 50,
			agentId: "validator",
		});

		const mockRetry = createMockRetryEngine();
		mockExecuteWithRetry.mockImplementation(
			async (fn: () => Promise<unknown>) => {
				// Simulate retry: first call fails, second succeeds
				try {
					const result = await fn();
					return { result, retries: 1 };
				} catch (err) {
					// retry once
					const result = await fn();
					return { result, retries: 1 };
				}
			},
		);

		const orchestrator = new WorkflowOrchestratorV2(
			mockReader as any,
			mockParser as any,
			mockValidator as any,
			mockArbitrator as any,
			{
				enableCircuitBreaker: false,
				enableMetrics: false,
				agentTimeoutMs: 5000,
				maxRetries: 1,
				retryEngine: mockRetry,
			},
		);

		const result = await orchestrator.processInvoice({
			type: "invoice_image",
			data: "test",
			metadata: {},
		});

		expect(result.status).toBe("success");
		expect(readerCallCount).toBe(2);
	});

	it("8. executeAgentWithRetry does NOT retry permanent error", async () => {
		mockReader.process.mockRejectedValue(
			new Error("validation failed: invalid RUC"),
		);

		mockParser.process.mockResolvedValue({
			parsedData: {},
			schemaVersion: "UBL_2.1",
			discrepancies: [],
			needsMigration: false,
			processingTime: 50,
			agentId: "parser",
		});
		mockValidator.process.mockResolvedValue({
			isCompliant: true,
			violations: [],
			processingTime: 50,
			agentId: "validator",
		});

		const mockRetry = createMockRetryEngine();
		// Simulate permanent error — no retry
		mockExecuteWithRetry.mockImplementation(
			async (fn: () => Promise<unknown>) => {
				try {
					const result = await fn();
					return { result, retries: 0 };
				} catch (err) {
					return {
						error: {
							type: "PERMANENT",
							message: (err as Error).message,
							agentName: "reader",
							retryable: false,
							recoverable: false,
						} as AgentError,
						retries: 0,
					};
				}
			},
		);

		const orchestrator = new WorkflowOrchestratorV2(
			mockReader as any,
			mockParser as any,
			mockValidator as any,
			mockArbitrator as any,
			{
				enableCircuitBreaker: false,
				enableMetrics: false,
				agentTimeoutMs: 5000,
				maxRetries: 0,
				retryEngine: mockRetry,
			},
		);

		const result = await orchestrator.processInvoice({
			type: "invoice_image",
			data: "test",
			metadata: {},
		});

		expect(result.status).toBe("failed");
	});
});
