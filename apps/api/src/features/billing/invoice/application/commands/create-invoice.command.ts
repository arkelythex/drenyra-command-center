/**
 * Create Invoice Command - Application Layer
 * CQRS Command for creating new invoices
 *
 * Clean Architecture:
 * - Application layer defines use cases
 * - Command carries data, Handler executes logic
 * - No business logic here, just orchestration
 */

import { randomUUID } from "node:crypto";
import { Money } from "@arkelythex/domain";
import {
	type TaxRateProviderService,
	taxRateProviderService,
} from "../../../../taxation/application/services/tax-rate-provider.service";
import {
	type Currency,
	Invoice,
	type InvoiceItem,
} from "../../domain/invoice.entity";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";

export interface CreateInvoiceItemInput {
	productId?: string;
	description: string;
	quantity: string;
	unitPrice: string;
	taxType?: "GRAVADO" | "EXONERADO" | "INAFECTO";
}

export class CreateInvoiceCommand {
	constructor(
		public readonly companyId: string,
		public readonly customerId: string,
		public readonly series: string,
		public readonly issueDate: Date,
		public readonly dueDate: Date,
		public readonly currency: Currency,
		public readonly items: CreateInvoiceItemInput[],
		public readonly notes?: string,
		public readonly exchangeRate: number = 1.0,
	) {}

	static create(props: {
		companyId: string;
		customerId: string;
		series: string;
		issueDate: string | Date;
		dueDate: string | Date;
		currency?: string;
		items: CreateInvoiceItemInput[];
		notes?: string;
		exchangeRate?: string | number;
	}): CreateInvoiceCommand {
		return new CreateInvoiceCommand(
			props.companyId,
			props.customerId,
			props.series,
			props.issueDate instanceof Date
				? props.issueDate
				: new Date(props.issueDate),
			props.dueDate instanceof Date ? props.dueDate : new Date(props.dueDate),
			(props.currency as Currency) || "PEN",
			props.items,
			props.notes,
			props.exchangeRate
				? typeof props.exchangeRate === "string"
					? parseFloat(props.exchangeRate)
					: props.exchangeRate
				: 1.0,
		);
	}
}

export interface CreateInvoiceResult {
	invoiceId: string;
	invoiceNumber: string;
	correlative: number;
	status: string;
	totalAmount: { amount: string; currency: string };
	createdAt: Date;
}

function validateCreateInvoiceCommand(command: CreateInvoiceCommand): void {
	if (!command.companyId) {
		throw new Error("Company ID is required");
	}
	if (!command.customerId) {
		throw new Error("Customer ID is required");
	}
	if (!command.series || !/^[F|B][0-9]{3}$/.test(command.series)) {
		throw new Error("Series must match pattern F001 or B001");
	}
	if (command.items.length === 0) {
		throw new Error("At least one item is required");
	}
	if (command.dueDate < command.issueDate) {
		throw new Error("Due date must be after issue date");
	}
	for (const item of command.items) {
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

function calculateInvoiceItems(
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

function mapInvoiceToResult(invoice: Invoice): CreateInvoiceResult {
	return {
		invoiceId: invoice.id,
		invoiceNumber: invoice.invoiceNumber,
		correlative: invoice.correlative,
		status: invoice.status,
		totalAmount: {
			amount: invoice.totalAmount.toString(),
			currency: invoice.currency,
		},
		createdAt: invoice.createdAt,
	};
}

export async function createInvoice(input: {
	companyId: string;
	customerId: string;
	series: string;
	issueDate: Date;
	dueDate: Date;
	currency: Currency;
	items: CreateInvoiceItemInput[];
	notes?: string;
	exchangeRate?: number;
}): Promise<CreateInvoiceResult> {
	const invoiceRepository = new InvoiceRepository();
	const taxRateProvider: Pick<TaxRateProviderService, "getVatRate"> =
		taxRateProviderService;

	const command = new CreateInvoiceCommand(
		input.companyId,
		input.customerId,
		input.series,
		input.issueDate,
		input.dueDate,
		input.currency,
		input.items,
		input.notes,
		input.exchangeRate ?? 1.0,
	);

	validateCreateInvoiceCommand(command);

	const correlative = await invoiceRepository.getNextCorrelative(
		command.companyId,
		command.series,
	);

	const invoiceNumber = `${command.series}-${String(correlative).padStart(8, "0")}`;

	const vatRate = await taxRateProvider.getVatRate(command.issueDate);
	const items = calculateInvoiceItems(command.items, command.currency, vatRate);

	const invoice = Invoice.create({
		id: randomUUID(),
		companyId: command.companyId,
		customerId: command.customerId,
		series: command.series,
		correlative,
		invoiceNumber,
		issueDate: command.issueDate,
		dueDate: command.dueDate,
		currency: command.currency,
		exchangeRate: command.exchangeRate,
		items,
		notes: command.notes,
	});

	const savedInvoice = await invoiceRepository.create(invoice);

	return mapInvoiceToResult(savedInvoice);
}
