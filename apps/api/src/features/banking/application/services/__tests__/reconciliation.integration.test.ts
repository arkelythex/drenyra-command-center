/**
 * MatchingEngine Integration Test
 * Validates that QueryServices are properly injected and that
 * MatchContext delegates to the injected services correctly.
 *
 * @layer Integration Test
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillQueryService } from "../../../../billing/bill/application/services/bill.query-service";
import { InvoiceQueryService } from "../../../../billing/invoice/application/services/invoice.query-service";
import { MatchingEngine } from "../reconciliation-matching.service";

describe("MatchingEngine — QueryService wiring", () => {
	let matchingEngine: MatchingEngine;
	let mockInvoiceQueryService: InvoiceQueryService;
	let mockBillQueryService: BillQueryService;

	beforeEach(() => {
		mockInvoiceQueryService = {
			findByNumber: vi.fn(),
			findByAmountAndDateRange: vi.fn(),
			findByCustomer: vi.fn(),
			findPendingByAmount: vi.fn(),
			findPendingByDueDate: vi.fn(),
		} as unknown as InvoiceQueryService;

		mockBillQueryService = {
			findByNumber: vi.fn(),
			findByAmountAndDateRange: vi.fn(),
			findByVendor: vi.fn(),
			findPendingByAmount: vi.fn(),
			findPendingByDueDate: vi.fn(),
			findAll: vi.fn(),
		} as unknown as BillQueryService;

		matchingEngine = new MatchingEngine(
			undefined,
			mockInvoiceQueryService,
			mockBillQueryService,
		);
	});

	it("should successfully inject InvoiceQueryService and BillQueryService", () => {
		expect(matchingEngine).toBeDefined();
		expect(matchingEngine["invoiceQueryService"]).toBe(mockInvoiceQueryService);
		expect(matchingEngine["billQueryService"]).toBe(mockBillQueryService);
	});

	it("should use default instances if none provided", () => {
		const engine = new MatchingEngine();
		expect(engine["invoiceQueryService"]).toBeInstanceOf(InvoiceQueryService);
		expect(engine["billQueryService"]).toBeInstanceOf(BillQueryService);
	});

	it("buildContext should use InvoiceQueryService methods", () => {
		const context = matchingEngine["buildContext"]("company-1", "account-1");

		expect(context).toBeDefined();
		expect(context.findInvoiceByReference).toBeDefined();
		expect(context.findInvoicesByAmountAndDate).toBeDefined();
		expect(context.findInvoicesByAmountAndCustomer).toBeDefined();
	});

	it("buildContext should use BillQueryService methods", () => {
		const context = matchingEngine["buildContext"]("company-1", "account-1");

		expect(context).toBeDefined();
		expect(context.findBillByReference).toBeDefined();
		expect(context.findBillsByAmountAndDate).toBeDefined();
		expect(context.findBillsByAmountAndVendor).toBeDefined();
	});

	it("should call InvoiceQueryService.findByNumber when finding invoice by reference", async () => {
		(
			mockInvoiceQueryService.findByNumber as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			id: "invoice-1",
			invoiceNumber: "F001-00001",
			balanceDue: "100.00",
			dueDate: new Date(),
		});

		const context = matchingEngine["buildContext"]("company-1", "account-1");
		const result = await context.findInvoiceByReference(
			"company-1",
			"F001-00001",
		);

		expect(mockInvoiceQueryService.findByNumber).toHaveBeenCalledWith(
			"company-1",
			"F001-00001",
		);
		expect(result).toBeDefined();
		expect(result?.id).toBe("invoice-1");
	});

	it("should call BillQueryService.findByNumber when finding bill by reference", async () => {
		(
			mockBillQueryService.findByNumber as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			id: "bill-1",
			billNumber: "B001-00001",
			totalAmount: "100.00",
			dueDate: new Date(),
		});

		const context = matchingEngine["buildContext"]("company-1", "account-1");
		const result = await context.findBillByReference("company-1", "B001-00001");

		expect(mockBillQueryService.findByNumber).toHaveBeenCalledWith(
			"company-1",
			"B001-00001",
		);
		expect(result).toBeDefined();
		expect(result?.id).toBe("bill-1");
	});

	it("should call InvoiceQueryService.findByAmountAndDateRange for amount+date matching", async () => {
		const mockInvoices = [
			{
				id: "invoice-1",
				invoiceNumber: "F001-00001",
				balanceDue: "100.00",
				dueDate: new Date(),
			},
		];

		(
			mockInvoiceQueryService.findByAmountAndDateRange as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue(mockInvoices);

		const context = matchingEngine["buildContext"]("company-1", "account-1");
		const start = new Date("2026-02-01");
		const end = new Date("2026-02-28");
		const result = await context.findInvoicesByAmountAndDate(
			"company-1",
			"100.00",
			start,
			end,
		);

		expect(
			mockInvoiceQueryService.findByAmountAndDateRange,
		).toHaveBeenCalledWith("company-1", "100.00", { start, end });
		expect(result).toEqual(mockInvoices);
	});

	it("should call BillQueryService.findByVendor for entity matching", async () => {
		const mockBills = [
			{
				id: "bill-1",
				billNumber: "B001-00001",
				totalAmount: "100.00",
				dueDate: new Date(),
			},
		];

		(
			mockBillQueryService.findByVendor as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockBills);

		const context = matchingEngine["buildContext"]("company-1", "account-1");
		const result = await context.findBillsByAmountAndVendor(
			"company-1",
			"vendor-1",
			"100.00",
		);

		expect(mockBillQueryService.findByVendor).toHaveBeenCalledWith(
			"company-1",
			"vendor-1",
			"100.00",
		);
		expect(result).toEqual(mockBills);
	});
});
