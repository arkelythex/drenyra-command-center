/**
 * TaxCalculationService — shared invoice tax calculation logic.
 *
 * Extracted from duplicate implementations in:
 * - apps/api/.../commands/update-invoice.command.ts (calculateItems/calculateUpdateInvoiceItems)
 * - packages/application/.../use-cases/invoice/update-invoice.use-case.ts (inline TaxCalculator)
 *
 * Single source of truth for IGV calculation across the update pipeline.
 *
 * @layer Application (Service)
 */

import { randomUUID } from "node:crypto";
import { type Currency, Money } from "@drenyra/domain";

/**
 * Minimal interface for the tax rate provider dependency.
 * Concrete implementation is injected from the API feature.
 */
export interface TaxRateProvider {
	getVatRate(issueDate: Date): Promise<number>;
}

// ── Types ──

export interface CreateInvoiceItemInput {
	productId?: string;
	description: string;
	quantity: number;
	unitPrice: number;
	taxType?: "GRAVADO" | "EXONERADO" | "INAFECTO";
}

export interface InvoiceItemResult {
	id: string;
	productId?: string;
	description: string;
	quantity: number;
	unitPrice: Money;
	taxType: "GRAVADO" | "EXONERADO" | "INAFECTO";
	igvRate: number;
	subtotal: Money;
	igvAmount: Money;
	totalAmount: Money;
}

export interface InvoiceTotals {
	baseAmount: Money;
	igvAmount: Money;
	totalAmount: Money;
}

// ── Interface ──

export interface TaxCalculationService {
	calculateItems(
		input: CreateInvoiceItemInput[],
		currency: Currency,
		issueDate: Date,
	): Promise<InvoiceItemResult[]>;

	aggregateTotals(
		items: InvoiceItemResult[],
		currency: Currency,
	): InvoiceTotals;
}

// ── Implementation ──

export class TaxCalculationServiceImpl implements TaxCalculationService {
	constructor(private readonly taxRateProvider: TaxRateProvider) {}

	async calculateItems(
		input: CreateInvoiceItemInput[],
		currency: Currency,
		issueDate: Date,
	): Promise<InvoiceItemResult[]> {
		const vatRate = await this.taxRateProvider.getVatRate(issueDate);

		return input.map((item) => {
			const quantity = item.quantity;
			const unitPrice = Money.fromAmount(item.unitPrice, currency);
			const taxType = item.taxType || "GRAVADO";

			const subtotal = unitPrice.multiply(quantity);

			let subtotalWithoutTax: Money;
			let igvAmount: Money;
			let igvRate: number;
			let totalAmount: Money;

			if (taxType === "GRAVADO") {
				igvRate = Number((vatRate * 100).toFixed(2));
				// unitPrice is without IGV (SUNAT standard)
				subtotalWithoutTax = subtotal;
				igvAmount = subtotal.multiply(vatRate);
				totalAmount = subtotal.add(igvAmount);
			} else {
				igvRate = 0;
				subtotalWithoutTax = subtotal;
				igvAmount = Money.zero(currency);
				totalAmount = subtotal;
			}

			return {
				id: item.productId ?? randomUUID(),
				productId: item.productId,
				description: item.description,
				quantity,
				unitPrice,
				taxType,
				igvRate,
				subtotal: subtotalWithoutTax,
				igvAmount,
				totalAmount,
			} as InvoiceItemResult;
		});
	}

	aggregateTotals(
		items: InvoiceItemResult[],
		currency: Currency,
	): InvoiceTotals {
		const baseAmount = items.reduce(
			(sum, item) => sum.add(item.subtotal),
			Money.zero(currency),
		);
		const igvAmount = items.reduce(
			(sum, item) => sum.add(item.igvAmount),
			Money.zero(currency),
		);
		const totalAmount = items.reduce(
			(sum, item) => sum.add(item.totalAmount),
			Money.zero(currency),
		);

		return { baseAmount, igvAmount, totalAmount };
	}
}
