/**
 * Update Invoice Command
 * Updates a DRAFT invoice (full replace) including line items.
 *
 * @layer Application (Command)
 * @pattern CQRS Write Model
 */

import { randomUUID } from "node:crypto";
import { Money } from "@arkelythex/domain";
import {
	type TaxRateProviderService,
	taxRateProviderService,
} from "../../../../taxation/application/services/tax-rate-provider.service";
import type { Currency, InvoiceItem } from "../../domain/invoice.entity";
import { Invoice } from "../../domain/invoice.entity";
import type { IInvoiceRepository } from "../../domain/invoice.repository.interface";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";
import type { CreateInvoiceItemInput } from "./create-invoice.command";

export interface UpdateInvoiceInput {
	id: string;
	customerId: string;
	issueDate: Date;
	dueDate: Date;
	currency: Currency;
	exchangeRate?: number;
	notes?: string;
	items: CreateInvoiceItemInput[];
}

/**
 * @deprecated Use updateInvoice() function instead.
 */
export class UpdateInvoiceCommand {
	constructor(
		private readonly repository: IInvoiceRepository = new InvoiceRepository(),
		private readonly taxRateProvider: Pick<
			TaxRateProviderService,
			"getVatRate"
		> = taxRateProviderService,
	) {}

	async execute(input: UpdateInvoiceInput): Promise<Invoice> {
		const existing = await this.repository.findById(input.id);
		if (!existing) {
			throw new Error("Invoice not found");
		}

		if (!existing.canEdit()) {
			throw new Error("Only DRAFT invoices can be edited");
		}

		this.validateInput(input);

		const vatRate = await this.taxRateProvider.getVatRate(input.issueDate);
		const items = this.calculateItems(input.items, input.currency, vatRate);
		const computed = Invoice.create({
			id: existing.id,
			companyId: existing.companyId,
			customerId: input.customerId,
			series: existing.series,
			correlative: existing.correlative,
			invoiceNumber: existing.invoiceNumber,
			issueDate: input.issueDate,
			dueDate: input.dueDate,
			currency: input.currency,
			exchangeRate: input.exchangeRate ?? existing.exchangeRate,
			items,
			notes: input.notes,
		});

		const updated = new Invoice(
			computed.id,
			computed.companyId,
			computed.customerId,
			computed.series,
			computed.correlative,
			computed.invoiceNumber,
			computed.issueDate,
			computed.dueDate,
			computed.currency,
			computed.exchangeRate,
			computed.items,
			computed.subtotal,
			computed.igvAmount,
			computed.totalAmount,
			computed.balanceDue,
			existing.status,
			computed.notes,
			existing.createdAt,
			new Date(),
			existing.sunatCdr,
			existing.sunatTicket,
		);

		return await this.repository.update(updated);
	}

	private validateInput(input: UpdateInvoiceInput): void {
		if (!input.customerId) {
			throw new Error("Customer ID is required");
		}

		if (input.items.length === 0) {
			throw new Error("At least one item is required");
		}

		if (input.dueDate < input.issueDate) {
			throw new Error("Due date must be after issue date");
		}

		for (const item of input.items) {
			if (!item.description || item.description.length < 3) {
				throw new Error("Item description must be at least 3 characters");
			}

			const quantity = parseFloat(item.quantity);
			if (Number.isNaN(quantity) || quantity <= 0) {
				throw new Error("Item quantity must be a positive number");
			}

			const unitPrice = parseFloat(item.unitPrice);
			if (Number.isNaN(unitPrice) || unitPrice < 0) {
				throw new Error("Item unit price must be a non-negative number");
			}
		}
	}

	private calculateItems(
		inputItems: CreateInvoiceItemInput[],
		currency: Currency,
		vatRate: number,
	): InvoiceItem[] {
		return inputItems.map((input) => {
			const quantity = parseFloat(input.quantity);
			const unitPrice = Money.fromAmount(parseFloat(input.unitPrice), currency);
			const taxType = input.taxType || "GRAVADO";

			const subtotal = unitPrice.multiply(quantity);

			let subtotalWithoutTax: Money;
			let igvAmount: Money;
			let igvRate: number;
			let totalAmount: Money;

			if (taxType === "GRAVADO") {
				igvRate = Number((vatRate * 100).toFixed(2));
				subtotalWithoutTax = subtotal.divide(1 + vatRate);
				igvAmount = subtotal.subtract(subtotalWithoutTax);
				totalAmount = subtotal;
			} else {
				igvRate = 0;
				subtotalWithoutTax = subtotal;
				igvAmount = Money.zero(currency);
				totalAmount = subtotal;
			}

			return {
				id: randomUUID(),
				productId: input.productId,
				description: input.description,
				quantity,
				unitPrice,
				taxType,
				igvRate,
				subtotal: subtotalWithoutTax,
				igvAmount,
				totalAmount,
			} as InvoiceItem;
		});
	}
}

function validateUpdateInvoiceInput(input: UpdateInvoiceInput): void {
	if (!input.customerId) {
		throw new Error("Customer ID is required");
	}
	if (input.items.length === 0) {
		throw new Error("At least one item is required");
	}
	if (input.dueDate < input.issueDate) {
		throw new Error("Due date must be after issue date");
	}
	for (const item of input.items) {
		if (!item.description || item.description.length < 3) {
			throw new Error("Item description must be at least 3 characters");
		}
		const quantity = parseFloat(item.quantity);
		if (Number.isNaN(quantity) || quantity <= 0) {
			throw new Error("Item quantity must be a positive number");
		}
		const unitPrice = parseFloat(item.unitPrice);
		if (Number.isNaN(unitPrice) || unitPrice < 0) {
			throw new Error("Item unit price must be a non-negative number");
		}
	}
}

function calculateUpdateInvoiceItems(
	inputItems: CreateInvoiceItemInput[],
	currency: Currency,
	vatRate: number,
): InvoiceItem[] {
	return inputItems.map((input) => {
		const quantity = parseFloat(input.quantity);
		const unitPrice = Money.fromAmount(parseFloat(input.unitPrice), currency);
		const taxType = input.taxType || "GRAVADO";

		const subtotal = unitPrice.multiply(quantity);

		let subtotalWithoutTax: Money;
		let igvAmount: Money;
		let igvRate: number;
		let totalAmount: Money;

		if (taxType === "GRAVADO") {
			igvRate = Number((vatRate * 100).toFixed(2));
			subtotalWithoutTax = subtotal.divide(1 + vatRate);
			igvAmount = subtotal.subtract(subtotalWithoutTax);
			totalAmount = subtotal;
		} else {
			igvRate = 0;
			subtotalWithoutTax = subtotal;
			igvAmount = Money.zero(currency);
			totalAmount = subtotal;
		}

		return {
			id: randomUUID(),
			productId: input.productId,
			description: input.description,
			quantity,
			unitPrice,
			taxType,
			igvRate,
			subtotal: subtotalWithoutTax,
			igvAmount,
			totalAmount,
		} as InvoiceItem;
	});
}

export async function updateInvoice(
	input: UpdateInvoiceInput,
): Promise<Invoice> {
	const repository = new InvoiceRepository();
	const taxRateProvider: Pick<TaxRateProviderService, "getVatRate"> =
		taxRateProviderService;

	const existing = await repository.findById(input.id);
	if (!existing) {
		throw new Error("Invoice not found");
	}

	if (!existing.canEdit()) {
		throw new Error("Only DRAFT invoices can be edited");
	}

	validateUpdateInvoiceInput(input);

	const vatRate = await taxRateProvider.getVatRate(input.issueDate);
	const items = calculateUpdateInvoiceItems(
		input.items,
		input.currency,
		vatRate,
	);
	const computed = Invoice.create({
		id: existing.id,
		companyId: existing.companyId,
		customerId: input.customerId,
		series: existing.series,
		correlative: existing.correlative,
		invoiceNumber: existing.invoiceNumber,
		issueDate: input.issueDate,
		dueDate: input.dueDate,
		currency: input.currency,
		exchangeRate: input.exchangeRate ?? existing.exchangeRate,
		items,
		notes: input.notes,
	});

	const updated = new Invoice(
		computed.id,
		computed.companyId,
		computed.customerId,
		computed.series,
		computed.correlative,
		computed.invoiceNumber,
		computed.issueDate,
		computed.dueDate,
		computed.currency,
		computed.exchangeRate,
		computed.items,
		computed.subtotal,
		computed.igvAmount,
		computed.totalAmount,
		computed.balanceDue,
		existing.status,
		computed.notes,
		existing.createdAt,
		new Date(),
		existing.sunatCdr,
		existing.sunatTicket,
	);

	return await repository.update(updated);
}
