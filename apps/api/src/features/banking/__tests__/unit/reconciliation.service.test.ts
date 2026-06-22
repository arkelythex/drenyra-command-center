import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MatchingStrategy } from "../../domain/services/matching-strategy";
import { TransactionBuilder, TestIds } from "../fixtures/banking.fixtures";
import type { MatchCandidate } from "../../domain/services/matching-strategy";

// Mock DB modules used by ReconciliationService
const mockDb = {
	query: {
		bankTransactions: { findMany: vi.fn() },
		businessPartners: { findMany: vi.fn() },
	},
	update: vi.fn().mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
	}),
};

vi.mock("@arkelythex/persistence/client", () => ({
	db: mockDb,
}));

vi.mock("@arkelythex/persistence/query", () => ({
	eq: (a: unknown, b: unknown) => ({ column: a, value: b }),
	and: (...conditions: unknown[]) => conditions,
	gte: (a: unknown, b: unknown) => ({ column: a, value: b, op: ">=" }),
	lte: (a: unknown, b: unknown) => ({ column: a, value: b, op: "<=" }),
}));

vi.mock("@arkelythex/persistence/schema", () => ({
	bankTransactions: {
		id: "id",
		companyId: "company_id",
		accountId: "account_id",
		isReconciled: "is_reconciled",
		transactionDate: "transaction_date",
	},
	businessPartners: { companyId: "company_id" },
}));

const { ReconciliationService } = await import(
	"../../application/services/reconciliation.service"
);

function createMockStrategy(
	overrides: Partial<MatchCandidate> & { score: number },
): MatchingStrategy {
	return {
		priority: 100,
		criteria: overrides.criteria ?? "REFERENCE",
		match: vi.fn().mockResolvedValue({
			documentId: overrides.documentId ?? "doc-1",
			documentType: overrides.documentType ?? "INVOICE",
			score: overrides.score,
			criteria: overrides.criteria ?? "REFERENCE",
			relatedTransactionIds: overrides.relatedTransactionIds,
		}),
	};
}

describe("ReconciliationService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.query.businessPartners.findMany.mockResolvedValue([]);
	});

	it("returns 0 when no unreconciled transactions exist", async () => {
		mockDb.query.bankTransactions.findMany.mockResolvedValue([]);

		const service = new ReconciliationService();
		const result = await service.autoReconcile(
			TestIds.company,
			TestIds.account,
		);

		expect(result.reconciledCount).toBe(0);
		expect(result.attemptedCount).toBe(0);
		expect(result.matches).toEqual([]);
	});

	it("reconciles by reference match (invoice)", async () => {
		const tx = TransactionBuilder.create({
			id: "tx-ref",
			companyId: TestIds.company,
			accountId: TestIds.account,
			type: "CREDIT",
			reference: "F001-123",
			amount: "1000.00",
		});

		mockDb.query.bankTransactions.findMany.mockResolvedValue([tx]);

		const service = new ReconciliationService([
			createMockStrategy({
				documentId: "inv-123",
				documentType: "INVOICE",
				score: 100,
				criteria: "REFERENCE",
			}),
		]);
		const result = await service.autoReconcile(
			TestIds.company,
			TestIds.account,
		);

		expect(result.reconciledCount).toBe(1);
		expect(result.matches).toEqual([
			{
				transactionId: "tx-ref",
				documentId: "inv-123",
				documentType: "INVOICE",
				matchScore: 100,
				matchCriteria: "REFERENCE",
			},
		]);
		expect(mockDb.update).toHaveBeenCalled();
	});

	it("reconciles partial payments when sum matches balance due", async () => {
		const tx1 = TransactionBuilder.create({
			id: "tx-p1",
			companyId: TestIds.company,
			accountId: TestIds.account,
			amount: "1000.00",
			type: "CREDIT",
		});
		const tx2 = TransactionBuilder.create({
			id: "tx-p2",
			companyId: TestIds.company,
			accountId: TestIds.account,
			amount: "2000.00",
			type: "CREDIT",
		});

		mockDb.query.bankTransactions.findMany.mockResolvedValue([tx1, tx2]);

		const service = new ReconciliationService([
			createMockStrategy({
				documentId: "inv-200",
				documentType: "INVOICE",
				score: 60,
				criteria: "PARTIAL",
				relatedTransactionIds: ["tx-p1", "tx-p2"],
			}),
		]);
		const result = await service.autoReconcile(
			TestIds.company,
			TestIds.account,
		);

		expect(result.reconciledCount).toBe(2);
		expect(result.matches).toHaveLength(2);
		expect(result.matches.every((m) => m.matchCriteria === "PARTIAL")).toBe(
			true,
		);
	});
});
