import { describe, expect, it, vi } from "vitest";
import { TaxationService } from "../../application/services/taxation.service";

describe("TaxationService", () => {
	it("calculates IGV summary with normalized envelope values", async () => {
		const repository = {
			getSalesSummary: vi
				.fn()
				.mockResolvedValue({ subtotal: "1000.00", igv: "180.00" }),
			getPaidRevenue: vi.fn(),
			findInvoicesAboveAmount: vi.fn(),
		};
		const service = new TaxationService(repository);

		const result = await service.getIGVSummary("cmp-1", 2026, 2);

		expect(result).toEqual({
			period: "2026-02",
			sales: "1000.00",
			purchases: "0",
			igvSales: "180.00",
			igvPurchases: "0",
			igvToPay: "180.00",
			igvToRefund: "0",
		});
		expect(repository.getSalesSummary).toHaveBeenCalledTimes(1);
	});

	it("calculates income tax projection using 29.5% rate", async () => {
		const repository = {
			getSalesSummary: vi.fn(),
			getPaidRevenue: vi.fn().mockResolvedValue({ total: "1000.00" }),
			findInvoicesAboveAmount: vi.fn(),
		};
		const service = new TaxationService(repository);

		const result = await service.getIncomeTaxProjection("cmp-1", 2026);

		expect(result.year).toBe(2026);
		expect(result.revenue).toBe("1000.00");
		expect(result.taxRate).toBe(0.295);
		expect(result.estimatedTax).toBe("295.00");
	});

	it("maps detractions from invoices above threshold", async () => {
		const dueDate = new Date("2026-02-20T00:00:00.000Z");
		const repository = {
			getSalesSummary: vi.fn(),
			getPaidRevenue: vi.fn(),
			findInvoicesAboveAmount: vi.fn().mockResolvedValue([
				{
					id: "inv-1",
					totalAmount: "1000.00",
					currency: "PEN",
					dueDate,
				},
			]),
		};
		const service = new TaxationService(repository);

		const result = await service.getDetractions("cmp-1");

		expect(repository.findInvoicesAboveAmount).toHaveBeenCalledWith(
			"cmp-1",
			"700.00",
		);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: "inv-1",
			companyId: "cmp-1",
			invoiceId: "inv-1",
			amount: "100.00",
			percentage: 10,
			status: "PENDING",
			dueDate,
		});
	});

	it("builds 12 months tax calendar", async () => {
		const repository = {
			getSalesSummary: vi.fn(),
			getPaidRevenue: vi.fn(),
			findInvoicesAboveAmount: vi.fn(),
		};
		const service = new TaxationService(repository);

		const result = await service.getTaxCalendar("cmp-1", 2026);

		expect(result).toHaveLength(12);
		expect(result[0]?.month).toBe("2026-01");
		expect(result[11]?.month).toBe("2026-12");
		expect(result[0]?.declarations[0]?.type).toBe("IGV");
	});

	it("moves negative IGV to refund and keeps pay in zero", async () => {
		const repository = {
			getSalesSummary: vi
				.fn()
				.mockResolvedValue({ subtotal: "100.00", igv: "-18.00" }),
			getPaidRevenue: vi.fn(),
			findInvoicesAboveAmount: vi.fn(),
		};
		const service = new TaxationService(repository);

		const result = await service.getIGVSummary("cmp-1", 2026, 3);

		expect(result.igvToPay).toBe("0");
		expect(result.igvToRefund).toBe("18.00");
	});

	it("handles non-numeric amounts defensively", async () => {
		const dueDate = new Date("2026-02-20T00:00:00.000Z");
		const repository = {
			getSalesSummary: vi.fn(),
			getPaidRevenue: vi.fn().mockResolvedValue({ total: "invalid" }),
			findInvoicesAboveAmount: vi.fn().mockResolvedValue([
				{
					id: "inv-usd",
					totalAmount: "invalid",
					currency: "USD",
					dueDate,
				},
			]),
		};
		const service = new TaxationService(repository);

		const projection = await service.getIncomeTaxProjection("cmp-1", 2026);
		const detractions = await service.getDetractions("cmp-1");

		expect(projection.revenue).toBe("0.00");
		expect(projection.estimatedTax).toBe("0.00");
		expect(detractions[0]?.amount).toBe("0.00");
	});
});
