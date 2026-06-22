/**
 * LedgerService Unit Tests
 *
 * @module ledger/__tests__/unit/ledger-service.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LedgerService } from "../../index";
import { db } from "@arkelythex/persistence/client";
import { categories, transactions } from "@arkelythex/persistence/schema";

vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@arkelythex/persistence/query", () => ({
	and: vi.fn(),
	eq: vi.fn(),
	asc: vi.fn(),
	desc: vi.fn(),
	gte: vi.fn(),
	lte: vi.fn(),
	sql: vi.fn((strings: TemplateStringsArray) => strings.join("")),
}));

describe("LedgerService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getChartOfAccounts", () => {
		it("should return default chart when no categories exist", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const result = await LedgerService.getChartOfAccounts("cmp-1");

			expect(result).toHaveLength(6);
			expect(result[0]).toMatchObject({
				code: "1040",
				name: "Caja y bancos",
				type: "ASSET",
				totalDebit: "0.00",
				totalCredit: "0.00",
				balance: "0.00",
			});
		});

		it("should map categories with transactions to chart accounts", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					categoryId: "cat-1",
					name: "Ventas locales",
					direction: "INCOME",
					activity: 5,
					totalDebit: 0,
					totalCredit: 5000,
				},
			]);

			const result = await LedgerService.getChartOfAccounts("cmp-1");

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				name: "Ventas locales",
				type: "REVENUE",
				activity: 5,
			});
		});

		it("should resolve account type based on direction", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					categoryId: "cat-1",
					name: "Compras",
					direction: "EXPENSE",
					activity: 3,
					totalDebit: 2000,
					totalCredit: 0,
				},
				{
					categoryId: "cat-2",
					name: "Cuenta bancaria",
					direction: null,
					activity: 1,
					totalDebit: 3000,
					totalCredit: 1000,
				},
			]);

			const result = await LedgerService.getChartOfAccounts("cmp-1");

			expect(result[0].type).toBe("EXPENSE");
			expect(result[1].type).toBe("ASSET");
		});

		it("should resolve account type as LIABILITY when credits exceed debits", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					categoryId: "cat-1",
					name: "Cuenta por pagar",
					direction: null,
					activity: 2,
					totalDebit: 500,
					totalCredit: 2000,
				},
			]);

			const result = await LedgerService.getChartOfAccounts("cmp-1");

			expect(result[0].type).toBe("LIABILITY");
		});

		it("should filter out rows with null name", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					categoryId: "cat-1",
					name: null,
					direction: "INCOME",
					activity: 0,
					totalDebit: 0,
					totalCredit: 0,
				},
				{
					categoryId: "cat-2",
					name: "Valid Category",
					direction: "EXPENSE",
					activity: 1,
					totalDebit: 100,
					totalCredit: 0,
				},
			]);

			const result = await LedgerService.getChartOfAccounts("cmp-1");

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Valid Category");
		});
	});

	describe("getGeneralLedger", () => {
		it("should return formatted general ledger entries", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					id: "tx-1",
					issueDate: new Date("2026-03-01"),
					series: "F001",
					number: "000001",
					notes: "Venta de productos",
					documentType: "FACTURA",
					totalAmount: "1180.00",
					direction: "INCOME",
					categoryName: "Ventas",
				},
			]);

			const result = await LedgerService.getGeneralLedger(
				"cmp-1",
				new Date("2026-03-01"),
				new Date("2026-03-31"),
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: "tx-1",
				voucher: "F001-000001",
				glosa: "Venta de productos",
				cuenta: "Ventas",
				debe: 0,
				haber: 1180,
				doc: "FACTURA F001 000001",
				bancarizado: false,
			});
		});

		it("should format expense entries with debe instead of haber", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					id: "tx-2",
					issueDate: new Date("2026-03-05"),
					series: "B001",
					number: "000001",
					notes: null,
					documentType: "BOLETA",
					totalAmount: "500.00",
					direction: "EXPENSE",
					categoryName: "Compras",
				},
			]);

			const result = await LedgerService.getGeneralLedger(
				"cmp-1",
				new Date("2026-03-01"),
				new Date("2026-03-31"),
			);

			expect(result[0].debe).toBe(500);
			expect(result[0].haber).toBe(0);
		});

		it("should generate voucher from transaction ID when series/number missing", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					id: "tx-no-voucher",
					issueDate: new Date("2026-03-01"),
					series: null,
					number: null,
					notes: null,
					documentType: "MOVIMIENTO_BANCARIO",
					totalAmount: "100.00",
					direction: "EXPENSE",
					categoryName: null,
				},
			]);

			const result = await LedgerService.getGeneralLedger(
				"cmp-1",
				new Date("2026-03-01"),
				new Date("2026-03-31"),
			);

			expect(result[0].voucher).toMatch(/^TX-/);
			expect(result[0].bancarizado).toBe(true);
			expect(result[0].cuenta).toBe("SIN CATEGORIA");
		});

		it("should return empty array when no transactions exist", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const result = await LedgerService.getGeneralLedger(
				"cmp-1",
				new Date("2026-03-01"),
				new Date("2026-03-31"),
			);

			expect(result).toEqual([]);
		});

		it("should handle invalid amount strings gracefully", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					id: "tx-bad-amount",
					issueDate: new Date("2026-03-01"),
					series: "F001",
					number: "000001",
					notes: null,
					documentType: "FACTURA",
					totalAmount: "not-a-number",
					direction: "INCOME",
					categoryName: "Ventas",
				},
			]);

			const result = await LedgerService.getGeneralLedger(
				"cmp-1",
				new Date("2026-03-01"),
				new Date("2026-03-31"),
			);

			expect(result[0].haber).toBe(0);
		});
	});

	describe("getTrialBalance", () => {
		it("should return trial balance with accounts and totals", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					categoryId: "cat-1",
					name: "Caja",
					direction: null,
					activity: 10,
					totalDebit: 5000,
					totalCredit: 2000,
				},
				{
					categoryId: "cat-2",
					name: "Ventas",
					direction: "INCOME",
					activity: 8,
					totalDebit: 0,
					totalCredit: 3000,
				},
			]);

			const result = await LedgerService.getTrialBalance(
				"cmp-1",
				new Date("2026-03-31"),
			);

			expect(result.asOfDate).toBe("2026-03-31T00:00:00.000Z");
			expect(result.accounts).toHaveLength(2);
			expect(result.debits).toBe("5000.00");
			expect(result.credits).toBe("5000.00");
			expect(result.balance).toBe("0.00");
		});

		it("should return empty trial balance when no categories exist", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const result = await LedgerService.getTrialBalance(
				"cmp-1",
				new Date("2026-03-31"),
			);

			expect(result.accounts).toHaveLength(0);
			expect(result.debits).toBe("0.00");
			expect(result.credits).toBe("0.00");
			expect(result.balance).toBe("0.00");
		});

		it("should filter out accounts with null names", async () => {
			(db.orderBy as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					categoryId: "cat-null",
					name: null,
					direction: "INCOME",
					activity: 0,
					totalDebit: 0,
					totalCredit: 0,
				},
				{
					categoryId: "cat-valid",
					name: "IGV",
					direction: null,
					activity: 5,
					totalDebit: 1000,
					totalCredit: 1000,
				},
			]);

			const result = await LedgerService.getTrialBalance(
				"cmp-1",
				new Date("2026-03-31"),
			);

			expect(result.accounts).toHaveLength(1);
			expect(result.accounts[0].name).toBe("IGV");
		});
	});
});
