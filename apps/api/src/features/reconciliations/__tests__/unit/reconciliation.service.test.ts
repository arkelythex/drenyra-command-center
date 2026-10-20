import { describe, expect, it, vi } from "vitest";
import {
	ReconcileRejectedError,
	ReconciliationService,
} from "../../application/services/reconciliation.service";

const bankTx = {
	id: "tx-1",
	description: "TRANSFERENCIA RECIBIDA - ENTERPRISE",
	reference: "F001-1234",
	transactionDate: "2025-01-14",
	type: "CREDIT",
	amount: "15000.0000",
};

describe("ReconciliationService", () => {
	it("returns pending transactions using repository", async () => {
		const repository = {
			findPending: vi.fn().mockResolvedValue([{ id: "tx-1" }]),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn(),
			findOpenDocuments: vi.fn(),
		};
		const service = new ReconciliationService(repository);

		const result = await service.getPending("cmp-1");

		expect(repository.findPending).toHaveBeenCalledWith("cmp-1", 10);
		expect(result).toEqual([{ id: "tx-1" }]);
	});

	it("delegates reconciliation operations", async () => {
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn().mockResolvedValue([{ id: "tx-2" }]),
			markReconciled: vi
				.fn()
				.mockResolvedValue({ id: "tx-1", reconciledAt: new Date() }),
			markUnreconciled: vi
				.fn()
				.mockResolvedValue({ id: "tx-1", reconciledAt: null }),
			findAllByCompany: vi.fn(),
			findById: vi.fn(),
			findOpenDocuments: vi.fn(),
		};
		const service = new ReconciliationService(repository);

		const reconciled = await service.reconcile("cmp-1", "tx-1", {
			notes: "manual",
		});
		const unreconciled = await service.unreconcile("cmp-1", "tx-1");
		const list = await service.getReconciled("cmp-1", 25);

		expect(repository.markReconciled).toHaveBeenCalledWith("cmp-1", "tx-1", {
			notes: "manual",
		});
		expect(repository.markUnreconciled).toHaveBeenCalledWith("cmp-1", "tx-1");
		expect(repository.findReconciled).toHaveBeenCalledWith("cmp-1", 25);
		expect(reconciled).toMatchObject({ id: "tx-1" });
		expect(unreconciled).toMatchObject({ id: "tx-1" });
		expect(list).toEqual([{ id: "tx-2" }]);
	});

	it("builds reconciliation stats", async () => {
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn().mockResolvedValue([
				{ id: "a", amount: "100.00", reconciledAt: new Date() },
				{ id: "b", amount: "50.00", reconciledAt: null },
				{ id: "c", amount: "not-a-number", reconciledAt: null },
			]),
			findById: vi.fn(),
			findOpenDocuments: vi.fn(),
		};
		const service = new ReconciliationService(repository);

		const stats = await service.getStats("cmp-1");

		// Totals in integer cents; a corrupt amount is counted, never guessed.
		expect(stats).toEqual({
			total: 3,
			reconciled: { count: 1, amountCents: 10000 },
			pending: { count: 2, amountCents: 5000 },
			invalidAmounts: 1,
			percentage: (1 / 3) * 100,
		});
	});

	it("proposes open invoices that an inflow pays", async () => {
		const doc = {
			kind: "INVOICE" as const,
			id: "inv-1",
			number: "F001-1234",
			partnerName: "ENTERPRISE CORP",
			issueDate: "2025-01-10",
			dueDate: "2025-01-14",
			openCents: 1500000,
		};
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn().mockResolvedValue(bankTx),
			findOpenDocuments: vi.fn().mockResolvedValue([doc]),
		};
		const service = new ReconciliationService(repository);

		const result = await service.findMatches("cmp-1", "tx-1");

		expect(repository.findOpenDocuments).toHaveBeenCalledWith(
			"cmp-1",
			"INVOICE",
		);
		expect(result).toMatchObject({
			transactionId: "tx-1",
			amountCents: 1500000,
			confidence: 100,
			matches: [{ documentId: "inv-1", score: 100 }],
		});
	});

	it("links only a proposed document when reconciling", async () => {
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn(),
			markReconciled: vi.fn().mockResolvedValue({ id: "tx-1" }),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn().mockResolvedValue(bankTx),
			findOpenDocuments: vi.fn().mockResolvedValue([
				{
					kind: "INVOICE",
					id: "inv-1",
					number: "F001-1234",
					partnerName: "ENTERPRISE CORP",
					issueDate: "2025-01-10",
					dueDate: "2025-01-14",
					openCents: 1500000,
				},
			]),
		};
		const service = new ReconciliationService(repository);

		await expect(
			service.reconcile("cmp-1", "tx-1", { invoiceId: "inv-other" }),
		).rejects.toThrow(ReconcileRejectedError);
		await expect(
			service.reconcile("cmp-1", "tx-1", { billId: "inv-1" }),
		).rejects.toThrow(ReconcileRejectedError);
		expect(repository.markReconciled).not.toHaveBeenCalled();

		await service.reconcile("cmp-1", "tx-1", { invoiceId: "inv-1" });
		expect(repository.markReconciled).toHaveBeenCalledWith("cmp-1", "tx-1", {
			invoiceId: "inv-1",
		});
	});

	it("returns null when reconciling a transaction of another company", async () => {
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn().mockResolvedValue(null),
			findOpenDocuments: vi.fn(),
		};
		const service = new ReconciliationService(repository);

		await expect(
			service.reconcile("cmp-1", "tx-x", { invoiceId: "inv-1" }),
		).resolves.toBeNull();
		expect(repository.markReconciled).not.toHaveBeenCalled();
	});

	it("returns null matches when transaction does not belong to company", async () => {
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn().mockResolvedValue(null),
			findOpenDocuments: vi.fn(),
		};
		const service = new ReconciliationService(repository);

		const result = await service.findMatches("cmp-1", "tx-missing");

		expect(result).toBeNull();
	});

	it("clamps large list limits to avoid abusive queries", async () => {
		const repository = {
			findPending: vi.fn().mockResolvedValue([]),
			findReconciled: vi.fn().mockResolvedValue([]),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn(),
			findOpenDocuments: vi.fn(),
		};
		const service = new ReconciliationService(repository);

		await service.getPending("cmp-1", 9999);
		await service.getReconciled("cmp-1", 0);

		expect(repository.findPending).toHaveBeenCalledWith("cmp-1", 200);
		expect(repository.findReconciled).toHaveBeenCalledWith("cmp-1", 50);
	});
});
