/**
 * Invoice Query Service Unit Tests
 *
 * @layer Application Tests
 * @pattern Unit Test (Service Layer)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceQueryService } from "../invoice.query-service";

type InvoiceListResult = Awaited<
	ReturnType<InvoiceQueryService["findPendingByAmount"]>
>;
type InvoiceSingleResult = NonNullable<
	Awaited<ReturnType<InvoiceQueryService["findByNumber"]>>
>;

// Mock persistence + schema
vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		query: {
			invoices: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
		},
	},
}));

vi.mock("@arkelythex/persistence/query", () => ({
	eq: vi.fn(),
	and: vi.fn(),
	gte: vi.fn(),
	lte: vi.fn(),
	like: vi.fn(),
}));

vi.mock("@arkelythex/persistence/schema", () => ({
	invoices: {},
}));

describe("InvoiceQueryService", () => {
	let service: InvoiceQueryService;

	beforeEach(() => {
		service = new InvoiceQueryService();
		vi.clearAllMocks();
	});

	describe("findPendingByAmount", () => {
		it("should find invoices with matching amount", async () => {
			const mockInvoices = [
				{
					id: "inv-1",
					invoiceNumber: "F001-00001",
					balanceDue: "100.00",
					dueDate: new Date("2026-02-15"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockInvoices as InvoiceListResult);

			const result = await service.findPendingByAmount("company-1", "100.00");

			expect(result).toEqual(mockInvoices);
			expect(db.query.invoices.findMany).toHaveBeenCalledTimes(1);
		});

		it("should return empty array when no invoices match", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue([]);

			const result = await service.findPendingByAmount("company-1", "999.99");

			expect(result).toEqual([]);
		});
	});

	describe("findPendingByDueDate", () => {
		it("should find invoices within date range", async () => {
			const mockInvoices = [
				{
					id: "inv-1",
					invoiceNumber: "F001-00001",
					balanceDue: "100.00",
					dueDate: new Date("2026-02-15"),
				},
				{
					id: "inv-2",
					invoiceNumber: "F001-00002",
					balanceDue: "200.00",
					dueDate: new Date("2026-02-16"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockInvoices as InvoiceListResult);

			const result = await service.findPendingByDueDate("company-1", {
				start: new Date("2026-02-01"),
				end: new Date("2026-02-28"),
			});

			expect(result).toEqual(mockInvoices);
			expect(result.length).toBe(2);
		});
	});

	describe("findByNumber", () => {
		it("should find invoice by exact number", async () => {
			const mockInvoice = {
				id: "inv-1",
				invoiceNumber: "F001-00001",
				balanceDue: "100.00",
				dueDate: new Date("2026-02-15"),
			};

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findFirst as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockInvoice as InvoiceSingleResult);

			const result = await service.findByNumber("company-1", "F001-00001");

			expect(result).toEqual(mockInvoice);
			expect(db.query.invoices.findFirst).toHaveBeenCalledTimes(1);
		});

		it("should return null when invoice not found", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findFirst as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			const result = await service.findByNumber("company-1", "NONEXISTENT");

			expect(result).toBeNull();
		});

		it("should escape LIKE pattern special characters", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findFirst as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			await service.findByNumber("company-1", "F001%00001");

			// Should escape the % character
			expect(db.query.invoices.findFirst).toHaveBeenCalled();
		});
	});

	describe("findByCustomer", () => {
		it("should find invoices by customer and amount", async () => {
			const mockInvoices = [
				{
					id: "inv-1",
					invoiceNumber: "F001-00001",
					balanceDue: "100.00",
					dueDate: new Date("2026-02-15"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockInvoices as InvoiceListResult);

			const result = await service.findByCustomer(
				"company-1",
				"customer-1",
				"100.00",
			);

			expect(result).toEqual(mockInvoices);
		});
	});

	describe("findByAmountAndDateRange", () => {
		it("should find invoices by amount and date range", async () => {
			const mockInvoices = [
				{
					id: "inv-1",
					invoiceNumber: "F001-00001",
					balanceDue: "100.00",
					dueDate: new Date("2026-02-15"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockInvoices as InvoiceListResult);

			const result = await service.findByAmountAndDateRange(
				"company-1",
				"100.00",
				{
					start: new Date("2026-02-01"),
					end: new Date("2026-02-28"),
				},
			);

			expect(result).toEqual(mockInvoices);
		});

		it("should return empty array when no match", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.invoices.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue([]);

			const result = await service.findByAmountAndDateRange(
				"company-1",
				"999.99",
				{
					start: new Date("2026-01-01"),
					end: new Date("2026-01-31"),
				},
			);

			expect(result).toEqual([]);
		});
	});
});
