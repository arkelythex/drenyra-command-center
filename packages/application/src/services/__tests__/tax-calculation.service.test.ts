import { Money } from "@drenyra/domain";
import { describe, expect, it, vi } from "vitest";
import {
	type CreateInvoiceItemInput,
	TaxCalculationServiceImpl,
} from "../tax-calculation.service";

function createMockProvider(vatRate = 0.18) {
	return {
		getVatRate: vi.fn().mockResolvedValue(vatRate),
	};
}

describe("TaxCalculationServiceImpl", () => {
	describe("calculateItems()", () => {
		it("should calculate IGV for GRAVADO items", async () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					description: "Servicio de consultoría",
					quantity: 1,
					unitPrice: 100,
					taxType: "GRAVADO",
				},
			];

			const result = await service.calculateItems(input, "PEN", new Date());

			expect(result).toHaveLength(1);
			expect(result[0].taxType).toBe("GRAVADO");
			expect(result[0].igvRate).toBe(18);
			// unitPrice = 100 (without IGV), subtotal = 100 * 1 = 100
			// IGV = 100 * 0.18 = 18, total = 100 + 18 = 118
			expect(result[0].subtotal.toString()).toBe("100.00");
			expect(result[0].igvAmount.toString()).toBe("18.00");
			expect(result[0].totalAmount.toString()).toBe("118.00");
		});

		it("should return zero IGV for EXONERADO items", async () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					description: "Producto exonerado",
					quantity: 2,
					unitPrice: 50,
					taxType: "EXONERADO",
				},
			];

			const result = await service.calculateItems(input, "PEN", new Date());

			expect(result[0].igvRate).toBe(0);
			expect(result[0].igvAmount.toString()).toBe("0.00");
			expect(result[0].subtotal.toString()).toBe("100.00");
			expect(result[0].totalAmount.toString()).toBe("100.00");
		});

		it("should return zero IGV for INAFECTO items", async () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					description: "Producto inafecto",
					quantity: 3,
					unitPrice: 25,
					taxType: "INAFECTO",
				},
			];

			const result = await service.calculateItems(input, "PEN", new Date());

			expect(result[0].igvRate).toBe(0);
			expect(result[0].igvAmount.toString()).toBe("0.00");
			expect(result[0].subtotal.toString()).toBe("75.00");
			expect(result[0].totalAmount.toString()).toBe("75.00");
		});

		it("should default to GRAVADO when no taxType provided", async () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					description: "Default tax type",
					quantity: 1,
					unitPrice: 118,
				},
			];

			const result = await service.calculateItems(input, "PEN", new Date());

			expect(result[0].taxType).toBe("GRAVADO");
			expect(result[0].igvRate).toBe(18);
		});

		it("should use vatRate from provider", async () => {
			const provider = createMockProvider(0.1); // 10% VAT
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					description: "Low VAT test",
					quantity: 1,
					unitPrice: 100,
					taxType: "GRAVADO",
				},
			];

			const result = await service.calculateItems(input, "PEN", new Date());

			expect(provider.getVatRate).toHaveBeenCalled();
			expect(result[0].igvRate).toBe(10);
			// unitPrice=100 (without IGV), vatRate=0.10
			// subtotal=100, IGV=10, total=110
			expect(result[0].subtotal.toString()).toBe("100.00");
			expect(result[0].igvAmount.toString()).toBe("10.00");
			expect(result[0].totalAmount.toString()).toBe("110.00");
		});

		it("should assign productId as id when provided", async () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					productId: "prod_123",
					description: "With product ID",
					quantity: 1,
					unitPrice: 100,
					taxType: "GRAVADO",
				},
			];

			const result = await service.calculateItems(input, "PEN", new Date());

			expect(result[0].id).toBe("prod_123");
		});

		it("should handle multiple items with mixed taxTypes", async () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					description: "Gravado",
					quantity: 1,
					unitPrice: 118,
					taxType: "GRAVADO",
				},
				{
					description: "Exonerado",
					quantity: 1,
					unitPrice: 100,
					taxType: "EXONERADO",
				},
			];

			const result = await service.calculateItems(input, "PEN", new Date());

			expect(result).toHaveLength(2);
			// Gravado: unitPrice 118 (without IGV), IGV = 118*0.18 = 21.24
			expect(result[0].igvAmount.toString()).toBe("21.24");
			expect(result[0].totalAmount.toString()).toBe("139.24");
			// Exonerado
			expect(result[1].igvAmount.toString()).toBe("0.00");
			expect(result[1].totalAmount.toString()).toBe("100.00");
		});

		it("should use different currencies correctly", async () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const input: CreateInvoiceItemInput[] = [
				{
					description: "USD item",
					quantity: 1,
					unitPrice: 118,
					taxType: "GRAVADO",
				},
			];

			const result = await service.calculateItems(input, "USD", new Date());

			expect(result[0].unitPrice.getCurrency()).toBe("USD");
			expect(result[0].subtotal.getCurrency()).toBe("USD");
			expect(result[0].igvAmount.getCurrency()).toBe("USD");
		});
	});

	describe("aggregateTotals()", () => {
		it("should sum base amounts correctly", () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const items = [createItem(100, 18, 118), createItem(200, 36, 236)];

			const totals = service.aggregateTotals(items, "PEN");

			expect(totals.baseAmount.toString()).toBe("300.00");
		});

		it("should sum IGV amounts correctly", () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const items = [createItem(100, 18, 118), createItem(200, 36, 236)];

			const totals = service.aggregateTotals(items, "PEN");

			expect(totals.igvAmount.toString()).toBe("54.00");
		});

		it("should sum total amounts correctly", () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const items = [createItem(100, 18, 118), createItem(200, 36, 236)];

			const totals = service.aggregateTotals(items, "PEN");

			expect(totals.totalAmount.toString()).toBe("354.00");
		});

		it("should return Money.zero for empty items", () => {
			const provider = createMockProvider(0.18);
			const service = new TaxCalculationServiceImpl(provider);

			const totals = service.aggregateTotals([], "PEN");

			expect(totals.baseAmount.toString()).toBe("0.00");
			expect(totals.igvAmount.toString()).toBe("0.00");
			expect(totals.totalAmount.toString()).toBe("0.00");
		});
	});
});

function createItem(subtotal: number, igv: number, total: number) {
	return {
		id: "item_test",
		description: "Test item",
		quantity: 1,
		unitPrice: Money.fromAmount(total, "PEN"),
		taxType: "GRAVADO" as const,
		igvRate: 18,
		subtotal: Money.fromAmount(subtotal, "PEN"),
		igvAmount: Money.fromAmount(igv, "PEN"),
		totalAmount: Money.fromAmount(total, "PEN"),
	};
}
