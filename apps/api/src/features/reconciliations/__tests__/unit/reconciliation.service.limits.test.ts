import { describe, expect, it, vi } from "vitest";
import { ReconciliationService } from "../../application/services/reconciliation.service";

function createRepository() {
	return {
		findPending: vi.fn().mockResolvedValue([]),
		findReconciled: vi.fn().mockResolvedValue([]),
		markReconciled: vi.fn(),
		markUnreconciled: vi.fn(),
		findAllByCompany: vi.fn(),
		findById: vi.fn(),
	};
}

describe("ReconciliationService list limits", () => {
	it.each([
		[Number.NaN, 10],
		[Number.POSITIVE_INFINITY, 10],
		[-1, 10],
		[0, 10],
		[1.9, 1],
		[200, 200],
		[201, 200],
	])("normalizes pending limit %s to %s", async (requested, expected) => {
		const repository = createRepository();
		const service = new ReconciliationService(repository);

		await service.getPending("cmp-1", requested);

		expect(repository.findPending).toHaveBeenCalledWith("cmp-1", expected);
	});

	it.each([
		[Number.NaN, 50],
		[Number.NEGATIVE_INFINITY, 50],
		[-10, 50],
		[0, 50],
		[50.8, 50],
		[201, 200],
	])("normalizes reconciled limit %s to %s", async (requested, expected) => {
		const repository = createRepository();
		const service = new ReconciliationService(repository);

		await service.getReconciled("cmp-1", requested);

		expect(repository.findReconciled).toHaveBeenCalledWith("cmp-1", expected);
	});
});
