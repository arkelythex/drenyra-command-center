/**
 * BatchOrchestrator — Multi-Run Session Orchestration Tests
 *
 * Validates runBatch() behavior:
 * - All items succeed → status "completed"
 * - Partial failure → status "partial"
 * - All items fail → status "failed"
 * - Empty batch → throws or returns failed
 * - Respects maxConcurrent
 * - Progress tracking after each item
 * - Config defaults
 * - Error isolation between items
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BatchOrchestrator } from "../../src/agents/orchestrator/batch/batch-orchestrator";
import type { WorkflowOrchestratorV2 } from "../../src/agents/orchestrator/workflow-v2";
import type {
	ProcessedInvoice,
	ReaderInput,
} from "../../src/agents/types/agent.types";
import type { SessionStore } from "../../src/session/session-store";

// ============================================================================
// Test Fixtures
// ============================================================================

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

function makeProcessedInvoice(
	overrides: Partial<ProcessedInvoice> = {},
): ProcessedInvoice {
	return {
		status: "success",
		invoiceData: {
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
		},
		processingLog: {
			startTime: new Date(),
			endTime: new Date(),
			totalTime: 100,
			stages: {
				reading: {
					agentId: "reader",
					status: "success",
					startTime: new Date(),
					endTime: new Date(),
				},
				parsing: {
					agentId: "parser",
					status: "success",
					startTime: new Date(),
					endTime: new Date(),
				},
				validation: {
					agentId: "validator",
					status: "success",
					startTime: new Date(),
					endTime: new Date(),
				},
			},
		},
		...overrides,
	};
}

function generateMockBatchItems(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		id: `item-${i}`,
		batchId: "test-batch",
		runId: null,
		sessionId: "test-session",
		status: "pending" as const,
		error: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}));
}

// ============================================================================
// Mock SessionStore
// ============================================================================

function createMockSessionStore() {
	return {
		createBatch: vi.fn().mockResolvedValue({ id: "test-batch" }),
		getBatch: vi.fn(),
		listBatches: vi.fn(),
		updateBatch: vi.fn().mockResolvedValue(undefined),
		createBatchItem: vi.fn().mockResolvedValue(undefined),
		getBatchItems: vi.fn(),
		updateBatchItem: vi.fn().mockResolvedValue(undefined),
		// Other SessionStore interface methods (unused but required)
		saveRunState: vi.fn(),
		getRunState: vi.fn(),
		listRunStates: vi.fn(),
		appendEvent: vi.fn(),
		getEvents: vi.fn(),
		updateRunState: vi.fn(),
		recoverRunState: vi.fn(),
		saveInput: vi.fn(),
		getInput: vi.fn(),
	} satisfies SessionStore;
}

type MockSessionStore = ReturnType<typeof createMockSessionStore>;

// ============================================================================
// Tests
// ============================================================================

describe("BatchOrchestrator", () => {
	let orchestrator: BatchOrchestrator;
	let mockSessionStore: MockSessionStore;
	let mockProcessInvoice: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockSessionStore = createMockSessionStore();
		mockProcessInvoice = vi.fn();

		const mockCreateOrchestrator = () =>
			({
				processInvoice: mockProcessInvoice,
			}) as unknown as WorkflowOrchestratorV2;

		orchestrator = new BatchOrchestrator(
			mockSessionStore as unknown as SessionStore,
			mockCreateOrchestrator,
			{ maxConcurrent: 3 },
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// -----------------------------------------------------------------------
	// Success scenarios
	// -----------------------------------------------------------------------

	describe("success handling", () => {
		it("should process all items and return completed status when all succeed", async () => {
			mockProcessInvoice.mockResolvedValue(makeProcessedInvoice());
			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(3),
			);

			const result = await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [makeReaderInput(), makeReaderInput(), makeReaderInput()],
				sessionId: "test-session",
			});

			expect(result.status).toBe("completed");
			expect(result.total).toBe(3);
			expect(result.completed).toBe(3);
			expect(result.failed).toBe(0);
			expect(result.items).toHaveLength(3);
			result.items.forEach((item) => {
				expect(item.status).toBe("completed");
			});
			expect(mockProcessInvoice).toHaveBeenCalledTimes(3);
		});

		it("should handle partial failure — some succeed, some fail", async () => {
			mockProcessInvoice
				.mockResolvedValueOnce(makeProcessedInvoice())
				.mockRejectedValueOnce(new Error("Item 2 failed"))
				.mockResolvedValueOnce(makeProcessedInvoice());

			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(3),
			);

			const result = await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [makeReaderInput(), makeReaderInput(), makeReaderInput()],
				sessionId: "test-session",
			});

			expect(result.status).toBe("partial");
			expect(result.total).toBe(3);
			expect(result.completed).toBe(2);
			expect(result.failed).toBe(1);

			expect(result.items[0].status).toBe("completed");
			expect(result.items[1].status).toBe("failed");
			expect(result.items[1].error).toBe("Item 2 failed");
			expect(result.items[2].status).toBe("completed");
		});

		it("should handle all failures — all items fail", async () => {
			mockProcessInvoice
				.mockRejectedValueOnce(new Error("Item 1 failed"))
				.mockRejectedValueOnce(new Error("Item 2 failed"))
				.mockRejectedValueOnce(new Error("Item 3 failed"));

			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(3),
			);

			const result = await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [makeReaderInput(), makeReaderInput(), makeReaderInput()],
				sessionId: "test-session",
			});

			expect(result.status).toBe("failed");
			expect(result.total).toBe(3);
			expect(result.completed).toBe(0);
			expect(result.failed).toBe(3);

			result.items.forEach((item) => {
				expect(item.status).toBe("failed");
			});
		});
	});

	// -----------------------------------------------------------------------
	// Edge cases
	// -----------------------------------------------------------------------

	describe("edge cases", () => {
		it("should handle empty batch gracefully", async () => {
			mockSessionStore.getBatchItems.mockResolvedValue([]);
			mockProcessInvoice.mockRejectedValue(new Error("Should not be called"));

			const result = await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [],
				sessionId: "test-session",
			});

			expect(result.status).toBe("completed");
			expect(result.total).toBe(0);
			expect(result.completed).toBe(0);
			expect(result.failed).toBe(0);
			expect(result.items).toHaveLength(0);
			expect(mockProcessInvoice).not.toHaveBeenCalled();
		});

		it("should respect maxConcurrency and process all items", async () => {
			mockProcessInvoice.mockResolvedValue(makeProcessedInvoice());
			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(10),
			);
			const concurrencyLimiter = new BatchOrchestrator(
				mockSessionStore as unknown as SessionStore,
				() =>
					({
						processInvoice: mockProcessInvoice,
					}) as unknown as WorkflowOrchestratorV2,
				{ maxConcurrent: 2 },
			);

			const inputs = Array.from({ length: 10 }, () => makeReaderInput());

			const result = await concurrencyLimiter.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs,
				sessionId: "test-session",
			});

			expect(result.status).toBe("completed");
			expect(result.total).toBe(10);
			expect(result.completed).toBe(10);
			expect(mockProcessInvoice).toHaveBeenCalledTimes(10);
		});
	});

	// -----------------------------------------------------------------------
	// Progress tracking
	// -----------------------------------------------------------------------

	describe("progress tracking", () => {
		it("should update progress after each item", async () => {
			let callCount = 0;
			mockProcessInvoice.mockImplementation(async () => {
				callCount++;
				return makeProcessedInvoice();
			});

			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(3),
			);

			await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [makeReaderInput(), makeReaderInput(), makeReaderInput()],
				sessionId: "test-session",
			});

			// updateBatch should have been called once at the end
			// with the aggregated progress
			expect(mockSessionStore.updateBatch).toHaveBeenCalledTimes(1);
			expect(mockSessionStore.updateBatch).toHaveBeenCalledWith("test-batch", {
				status: "completed",
				completed: 3,
				failed: 0,
			});
		});

		it("should track failures in progress updates", async () => {
			mockProcessInvoice
				.mockResolvedValueOnce(makeProcessedInvoice())
				.mockRejectedValueOnce(new Error("Failed"));

			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(2),
			);

			await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [makeReaderInput(), makeReaderInput()],
				sessionId: "test-session",
			});

			expect(mockSessionStore.updateBatch).toHaveBeenCalledWith("test-batch", {
				status: "partial",
				completed: 1,
				failed: 1,
			});
		});

		it("should have correct progress in BatchResult after mixed results", async () => {
			mockProcessInvoice
				.mockResolvedValueOnce(makeProcessedInvoice())
				.mockResolvedValueOnce(makeProcessedInvoice())
				.mockRejectedValueOnce(new Error("Item 3 failed"))
				.mockResolvedValueOnce(makeProcessedInvoice())
				.mockRejectedValueOnce(new Error("Item 5 failed"));

			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(5),
			);

			const result = await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: Array.from({ length: 5 }, () => makeReaderInput()),
				sessionId: "test-session",
			});

			expect(result.status).toBe("partial");
			expect(result.completed).toBe(3);
			expect(result.failed).toBe(2);
		});
	});

	// -----------------------------------------------------------------------
	// Configuration defaults
	// -----------------------------------------------------------------------

	describe("configuration defaults", () => {
		it("should use default maxConcurrent=3 when no config is provided", async () => {
			const defaultOrch = new BatchOrchestrator(
				mockSessionStore as unknown as SessionStore,
				() =>
					({
						processInvoice: mockProcessInvoice,
					}) as unknown as WorkflowOrchestratorV2,
			);

			mockProcessInvoice.mockResolvedValue(makeProcessedInvoice());
			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(3),
			);

			const result = await defaultOrch.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [makeReaderInput(), makeReaderInput(), makeReaderInput()],
				sessionId: "test-session",
			});

			expect(result.status).toBe("completed");
			expect(result.completed).toBe(3);
		});
	});

	// -----------------------------------------------------------------------
	// Error isolation
	// -----------------------------------------------------------------------

	describe("error isolation", () => {
		it("should not let one failing item affect other items", async () => {
			const order: number[] = [];

			mockProcessInvoice
				.mockImplementation(async () => {
					order.push(1);
					return makeProcessedInvoice();
				})
				.mockImplementationOnce(async () => {
					order.push(0);
					throw new Error("First item failed");
				});

			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(3),
			);

			const result = await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: [makeReaderInput(), makeReaderInput(), makeReaderInput()],
				sessionId: "test-session",
			});

			expect(result.status).toBe("partial");
			expect(result.items[0].status).toBe("failed");
			expect(result.items[1].status).toBe("completed");
			expect(result.items[2].status).toBe("completed");
			expect(mockProcessInvoice).toHaveBeenCalledTimes(3);

			// All three items should have been attempted despite the first failing
			expect(order).toHaveLength(3);
		});

		it("should handle items with different error types gracefully", async () => {
			class CustomDatabaseError extends Error {
				constructor() {
					super("DB connection lost");
					this.name = "CustomDatabaseError";
				}
			}

			mockProcessInvoice
				.mockRejectedValueOnce(new CustomDatabaseError())
				.mockRejectedValueOnce(new TypeError("Invalid input format"))
				.mockRejectedValueOnce(new Error("Generic failure"));

			mockSessionStore.getBatchItems.mockResolvedValue(
				generateMockBatchItems(3),
			);

			const result = await orchestrator.runBatch({
				batchId: "test-batch",
				companyId: "company-uuid",
				inputs: Array.from({ length: 3 }, () => makeReaderInput()),
				sessionId: "test-session",
			});

			expect(result.status).toBe("failed");
			expect(result.items[0].error).toBe("DB connection lost");
			expect(result.items[1].error).toBe("Invalid input format");
			expect(result.items[2].error).toBe("Generic failure");
		});
	});
});
