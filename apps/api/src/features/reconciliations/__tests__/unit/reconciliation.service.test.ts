import { describe, expect, it, vi } from "vitest";
import { ReconciliationService } from "../../application/services/reconciliation.service";

describe("ReconciliationService", () => {
	it("returns pending transactions using repository", async () => {
		const repository = {
			findPending: vi.fn().mockResolvedValue([{ id: "tx-1" }]),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn(),
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
		};
		const service = new ReconciliationService(repository);

		const stats = await service.getStats("cmp-1");

		expect(stats).toEqual({
			total: 3,
			reconciled: { count: 1, amount: 100 },
			pending: { count: 2, amount: 50 },
			percentage: (1 / 3) * 100,
		});
	});

	it("returns empty automatic matches placeholder", async () => {
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn().mockResolvedValue({ id: "tx-1" }),
		};
		const service = new ReconciliationService(repository);

		const result = await service.findMatches("cmp-1", "tx-1");

		expect(result).toEqual({
			transactionId: "tx-1",
			matches: [],
			confidence: 0,
		});
	});

	it("returns null matches when transaction does not belong to company", async () => {
		const repository = {
			findPending: vi.fn(),
			findReconciled: vi.fn(),
			markReconciled: vi.fn(),
			markUnreconciled: vi.fn(),
			findAllByCompany: vi.fn(),
			findById: vi.fn().mockResolvedValue(null),
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
		};
		const service = new ReconciliationService(repository);

		await service.getPending("cmp-1", 9999);
		await service.getReconciled("cmp-1", 0);

		expect(repository.findPending).toHaveBeenCalledWith("cmp-1", 200);
		expect(repository.findReconciled).toHaveBeenCalledWith("cmp-1", 50);
	});
});
