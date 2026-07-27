/**
 * Reconciliation Batch Handlers Tests
 *
 * Unit tests for the reconciliation batch API handlers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Drizzle queries
vi.mock("@drenyra/persistence/client", () => ({
	db: {
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(() => Promise.resolve([mockBatchRecord])),
			})),
		})),
		query: {
			bankReconciliations: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			bankTransactions: {
				findMany: vi.fn(),
			},
			transactionReconciliationMatches: {
				findMany: vi.fn(),
			},
		},
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([mockBatchRecord])),
				})),
			})),
		})),
	},
}));

vi.mock("@drenyra/persistence/query", () => ({
	and: (...args: unknown[]) => args,
	eq: (a: unknown, b: unknown) => ({ field: a, value: b }),
	desc: (a: unknown) => ({ field: a, dir: "desc" }),
	sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
		String.raw(strings as unknown as string[], ...values),
}));

// Mock the schema imports
vi.mock("@drenyra/persistence/schema", () => ({
	bankReconciliations: {},
	bankTransactions: {},
	reconciliationRules: {},
}));

import type { CompanyContext } from "../../../../shared/plugins/company-scope-guard";
import { reconciliationBatchHandlers } from "../../api/reconciliation-batch.handlers";

// Re-create inside module scope for mock
const mockBatchRecord = {
	id: "batch-123",
	companyId: "cmp-abc123",
	accountId: "acc-xyz789",
	startDate: "2026-07-01",
	endDate: "2026-07-31",
	openingBalance: "10000.00",
	closingBalance: "12500.00",
	statementBalance: null,
	status: "IN_PROGRESS",
	difference: null,
	notes: null,
	batchReference: "BATCH-2026-07-acc-xyz78",
	mode: "MANUAL",
	matchedCount: 5,
	unmatchedCount: 3,
	discrepancyAmount: null,
	closedAt: null,
	closedBy: null,
	createdAt: new Date("2026-07-31"),
	completedAt: null,
	completedBy: null,
};

const mockCompanyContext: CompanyContext = {
	companyId: "cmp-abc123",
	legacyUserId: "user-999",
};

function makeSet() {
	return { status: undefined as number | string | undefined };
}

describe("ReconciliationBatch Handlers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("createBatch", () => {
		it("rejects request without company context", async () => {
			const set = makeSet();
			const result = await reconciliationBatchHandlers.createBatch({
				body: {
					bankAccountId: "acc-xyz789",
					periodStart: new Date("2026-07-01"),
					periodEnd: new Date("2026-07-31"),
					openingBalance: 10000,
					currency: "PEN",
					mode: "MANUAL",
				},
				companyContext: undefined,
				set,
			});

			expect(set.status).toBe(401);
			expect(result).toHaveProperty("success", false);
		});

		it("creates a batch with valid data", async () => {
			const set = makeSet();
			const result = await reconciliationBatchHandlers.createBatch({
				body: {
					bankAccountId: "acc-xyz789",
					periodStart: new Date("2026-07-01"),
					periodEnd: new Date("2026-07-31"),
					openingBalance: 10000,
					currency: "PEN",
					mode: "MANUAL",
				},
				companyContext: mockCompanyContext,
				set,
			});

			expect(result).toHaveProperty("success", true);
		});
	});

	describe("getBatch", () => {
		it("rejects request without company context", async () => {
			const set = makeSet();
			const result = await reconciliationBatchHandlers.getBatch({
				params: { id: "batch-123" },
				companyContext: undefined,
				set,
			});

			expect(set.status).toBe(401);
			expect(result).toHaveProperty("success", false);
		});

		it("returns 404 for non-existent batch", async () => {
			const { db } = await import("@drenyra/persistence/client");
			(
				db.query.bankReconciliations.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			const set = makeSet();
			const result = await reconciliationBatchHandlers.getBatch({
				params: { id: "nonexistent" },
				companyContext: mockCompanyContext,
				set,
			});

			expect(set.status).toBe(404);
			expect(result).toHaveProperty("success", false);
		});
	});

	describe("listBatches", () => {
		it("rejects request without company context", async () => {
			const set = makeSet();
			const result = await reconciliationBatchHandlers.listBatches({
				query: { limit: 20, offset: 0 },
				companyContext: undefined,
				set,
			});

			expect(set.status).toBe(401);
			expect(result).toHaveProperty("success", false);
		});

		it("returns empty list when no batches exist", async () => {
			const { db } = await import("@drenyra/persistence/client");
			(
				db.query.bankReconciliations.findMany as ReturnType<typeof vi.fn>
			).mockResolvedValue([]);

			const set = makeSet();
			const result = await reconciliationBatchHandlers.listBatches({
				query: { limit: 20, offset: 0 },
				companyContext: mockCompanyContext,
				set,
			});

			expect(result).toHaveProperty("success", true);
		});
	});

	describe("closeBatch", () => {
		it("rejects request without company context", async () => {
			const set = makeSet();
			const result = await reconciliationBatchHandlers.closeBatch({
				params: { id: "batch-123" },
				body: { closingBalance: 12500 },
				companyContext: undefined,
				set,
			});

			expect(set.status).toBe(401);
			expect(result).toHaveProperty("success", false);
		});

		it("rejects close on already-closed batch", async () => {
			const { db } = await import("@drenyra/persistence/client");
			(
				db.query.bankReconciliations.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue({
				...mockBatchRecord,
				status: "COMPLETED",
				closedAt: new Date(),
			});

			const set = makeSet();
			const result = await reconciliationBatchHandlers.closeBatch({
				params: { id: "batch-123" },
				body: { closingBalance: 12500 },
				companyContext: mockCompanyContext,
				set,
			});

			expect(set.status).toBe(409);
			expect(result).toHaveProperty("success", false);
		});
	});

	describe("createMatch", () => {
		it("rejects request without company context", async () => {
			const set = makeSet();
			const result = await reconciliationBatchHandlers.createMatch({
				params: { id: "batch-123" },
				body: {
					bankTransactionId: "tx-456",
					documentId: "inv-789",
					documentType: "INVOICE",
					matchScore: 95,
					matchCriteria: "REFERENCE",
				},
				companyContext: undefined,
				set,
			});

			expect(set.status).toBe(401);
			expect(result).toHaveProperty("success", false);
		});
	});
});
