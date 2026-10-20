import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoicesGet } = vi.hoisted(() => ({ invoicesGet: vi.fn() }));

vi.mock("@/lib/api", () => ({
	api: { api: { invoices: { get: invoicesGet } } },
	getGovernanceAuditHeaders: () => ({}),
}));

import { invoicingList } from "../invoice.api";

const invoice = {
	id: "inv-1",
	invoiceNumber: "F001-1234",
	totalAmount: "1180",
};

describe("invoicingList", () => {
	beforeEach(() => {
		invoicesGet.mockReset();
	});

	it("reads the invoices out of the ok() envelope the API sends", async () => {
		invoicesGet.mockResolvedValue({
			data: { success: true, data: { invoices: [invoice], total: 1 } },
			error: null,
		});

		await expect(invoicingList({ companyId: "cmp-1" })).resolves.toEqual([
			invoice,
		]);
	});

	it("still accepts a bare page without the envelope", async () => {
		invoicesGet.mockResolvedValue({
			data: { invoices: [invoice], total: 1 },
			error: null,
		});

		await expect(invoicingList({ companyId: "cmp-1" })).resolves.toEqual([
			invoice,
		]);
	});

	it("fails instead of showing an empty board when the API refuses", async () => {
		invoicesGet.mockResolvedValue({
			data: { success: false, error: "Company scope mismatch" },
			error: null,
		});

		await expect(invoicingList({ companyId: "cmp-1" })).rejects.toThrow(
			"Company scope mismatch",
		);
	});
});
