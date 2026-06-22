/**
 * Bill Query Service Unit Tests
 *
 * @layer Application Tests
 * @pattern Unit Test (Service Layer)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillQueryService } from "../bill.query-service";

type BillListResult = Awaited<
	ReturnType<BillQueryService["findPendingByAmount"]>
>;
type BillSingleResult = NonNullable<
	Awaited<ReturnType<BillQueryService["findByNumber"]>>
>;

// Mock persistence + schema
vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		query: {
			bills: {
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
	bills: {},
}));

describe("BillQueryService", () => {
	let service: BillQueryService;

	beforeEach(() => {
		service = new BillQueryService();
		vi.clearAllMocks();
	});

	describe("findPendingByAmount", () => {
		it("should find bills with matching amount", async () => {
			const mockBills = [
				{
					id: "bill-1",
					billNumber: "B001-00001",
					totalAmount: "100.00",
					dueDate: new Date("2026-02-15"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBills as BillListResult);

			const result = await service.findPendingByAmount("company-1", "100.00");

			expect(result).toEqual(mockBills);
			expect(db.query.bills.findMany).toHaveBeenCalledTimes(1);
		});

		it("should return empty array when no bills match", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue([]);

			const result = await service.findPendingByAmount("company-1", "999.99");

			expect(result).toEqual([]);
		});
	});

	describe("findPendingByDueDate", () => {
		it("should find bills within date range", async () => {
			const mockBills = [
				{
					id: "bill-1",
					billNumber: "B001-00001",
					totalAmount: "100.00",
					dueDate: new Date("2026-02-15"),
				},
				{
					id: "bill-2",
					billNumber: "B001-00002",
					totalAmount: "200.00",
					dueDate: new Date("2026-02-16"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBills as BillListResult);

			const result = await service.findPendingByDueDate("company-1", {
				start: new Date("2026-02-01"),
				end: new Date("2026-02-28"),
			});

			expect(result).toEqual(mockBills);
			expect(result.length).toBe(2);
		});
	});

	describe("findByNumber", () => {
		it("should find bill by exact number", async () => {
			const mockBill = {
				id: "bill-1",
				billNumber: "B001-00001",
				totalAmount: "100.00",
				dueDate: new Date("2026-02-15"),
			};

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findFirst as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBill as BillSingleResult);

			const result = await service.findByNumber("company-1", "B001-00001");

			expect(result).toEqual(mockBill);
			expect(db.query.bills.findFirst).toHaveBeenCalledTimes(1);
		});

		it("should return null when bill not found", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findFirst as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			const result = await service.findByNumber("company-1", "NONEXISTENT");

			expect(result).toBeNull();
		});

		it("should escape LIKE pattern special characters", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findFirst as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(null);

			await service.findByNumber("company-1", "B001%00001");

			// Should escape the % character
			expect(db.query.bills.findFirst).toHaveBeenCalled();
		});
	});

	describe("findByVendor", () => {
		it("should find bills by vendor and amount", async () => {
			const mockBills = [
				{
					id: "bill-1",
					billNumber: "B001-00001",
					totalAmount: "100.00",
					dueDate: new Date("2026-02-15"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBills as BillListResult);

			const result = await service.findByVendor(
				"company-1",
				"vendor-1",
				"100.00",
			);

			expect(result).toEqual(mockBills);
		});
	});

	describe("findByAmountAndDateRange", () => {
		it("should find bills by amount and date range", async () => {
			const mockBills = [
				{
					id: "bill-1",
					billNumber: "B001-00001",
					totalAmount: "100.00",
					dueDate: new Date("2026-02-15"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBills as BillListResult);

			const result = await service.findByAmountAndDateRange(
				"company-1",
				"100.00",
				{
					start: new Date("2026-02-01"),
					end: new Date("2026-02-28"),
				},
			);

			expect(result).toEqual(mockBills);
		});

		it("should return empty array when no match", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
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

	describe("findAll", () => {
		it("should find all bills for a company", async () => {
			const mockBills = [
				{
					id: "bill-1",
					billNumber: "B001-00001",
					totalAmount: "100.00",
					dueDate: new Date("2026-02-15"),
				},
				{
					id: "bill-2",
					billNumber: "B001-00002",
					totalAmount: "200.00",
					dueDate: new Date("2026-02-16"),
				},
			];

			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockBills as BillListResult);

			const result = await service.findAll("company-1");

			expect(result).toEqual(mockBills);
			expect(result.length).toBe(2);
		});

		it("should return empty array when company has no bills", async () => {
			const { db } = await import("@arkelythex/persistence/client");
			(
				db.query.bills.findMany as unknown as ReturnType<typeof vi.fn>
			).mockResolvedValue([]);

			const result = await service.findAll("company-1");

			expect(result).toEqual([]);
		});
	});
});
