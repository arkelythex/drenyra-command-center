/**
 * Create Invoice Handler - Application Layer
 * Handles the CreateInvoiceCommand execution
 *
 * Clean Architecture:
 * - Orchestrates use case execution
 * - Uses repository interfaces (not implementations)
 * - Returns domain entities or DTOs
 */

import { randomUUID } from "node:crypto";
import { Money } from "@drenyra/domain";
import {
	type TaxRateProviderService,
	taxRateProviderService,
} from "../../../../taxation/application/services/tax-rate-provider.service";
import {
	type Currency,
	Invoice,
	type InvoiceItem,
} from "../../domain/invoice.entity";
import type { IInvoiceRepository } from "../../domain/invoice.repository.interface";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";
import type {
	CreateInvoiceCommand,
	CreateInvoiceItemInput,
} from "./create-invoice.command";

/**
 * Result DTO returned after successfully creating an invoice.
 *
 * Contains essential invoice metadata for API response.
 * Amounts are serialized as objects with amount and currency properties.
 *
 * @example
 * ```ts
 * const result: CreateInvoiceResult = {
 *   invoiceId: 'inv_123',
 *   invoiceNumber: 'F001-00000001',
 *   correlative: 1,
 *   status: 'DRAFT',
 *   totalAmount: { amount: '118.00', currency: 'PEN' },
 *   createdAt: new Date('2026-01-15T10:30:00Z'),
 * };
 * ```
 */
export interface CreateInvoiceResult {
	/** Generated invoice UUID */
	invoiceId: string;
	/** SUNAT-formatted invoice number (e.g., "F001-00000001") */
	invoiceNumber: string;
	/** Sequential correlative number within series */
	correlative: number;
	/** Invoice status (always "DRAFT" for newly created invoices) */
	status: string;
	/** Total invoice amount with currency */
	totalAmount: { amount: string; currency: string };
	/** Timestamp when invoice was created */
	createdAt: Date;
}

/**
 * Application service for executing invoice creation use case.
 *
 * Orchestrates the complete invoice creation workflow:
 * 1. Validates command input
 * 2. Generates next correlative number
 * 3. Calculates line item totals with IGV
 * 4. Creates domain entity
 * 5. Persists to repository
 * 6. Returns result DTO
 *
 * @example
 * ```ts
 * const repository = new InvoiceRepository();
 * const handler = new CreateInvoiceHandler(repository);
 * const result = await handler.execute(command);
 * console.log(result.invoiceNumber); // "F001-00000001"
 * ```
 */
export class CreateInvoiceHandler {
	constructor(
		private readonly invoiceRepository: IInvoiceRepository = new InvoiceRepository(),
		private readonly taxRateProvider: Pick<
			TaxRateProviderService,
			"getVatRate"
		> = taxRateProviderService,
	) {}

	/**
	 * Execute the invoice creation command.
	 *
	 * Validates all business rules, generates invoice number, calculates totals,
	 * and persists the invoice in DRAFT status.
	 *
	 * @param command - CreateInvoiceCommand with all required data
	 * @returns CreateInvoiceResult with generated invoice metadata
	 * @throws Error if validation fails or repository operation fails
	 * @example
	 * ```ts
	 * const command = CreateInvoiceCommand.create({ ... });
	 * const result = await handler.execute(command);
	 * console.log(`Created invoice ${result.invoiceNumber}`);
	 * ```
	 */
	async execute(command: CreateInvoiceCommand): Promise<CreateInvoiceResult> {
		// 1. Validate input
		this.validateCommand(command);

		// 2. Generate next correlative for series
		const correlative = await this.invoiceRepository.getNextCorrelative(
			command.companyId,
			command.series,
		);

		// 3. Format invoice number (e.g., F001-00000001)
		const invoiceNumber = `${command.series}-${String(correlative).padStart(8, "0")}`;

		// 4. Resolve VAT/IGV rate for issue date and calculate invoice items
		const vatRate = await this.taxRateProvider.getVatRate(command.issueDate);
		const items = this.calculateItems(command.items, command.currency, vatRate);

		// 5. Create invoice entity
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

		// 6. Persist invoice
		const savedInvoice = await this.invoiceRepository.create(invoice);

		// 7. Return result DTO
		return this.mapToResult(savedInvoice);
	}

	/**
	 * Validate command data against business rules.
	 *
	 * Enforces:
	 * - Required fields (companyId, customerId, series, items)
	 * - Series format (F001 or B001 pattern)
	 * - Due date after issue date
	 * - Item descriptions (min 3 chars)
	 * - Positive quantities and non-negative prices
	 *
	 * @param command - Command to validate
	 * @throws Error with descriptive message if validation fails
	 */
	private validateCommand(command: CreateInvoiceCommand): void {
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

		// Validate each item
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

	/**
	 * Calculate invoice items with IGV amounts.
	 *
	 * Applies SUNAT tax rules:
	 * - GRAVADO: 18% IGV included in price
	 * - EXONERADO/INAFECTO: 0% IGV
	 *
	 * Uses @drenyra/domain Money VO (cents pattern) to avoid floating-point errors.
	 *
	 * @param inputItems - Raw item inputs from command
	 * @param currency - Invoice currency (PEN or USD)
	 * @returns Calculated InvoiceItem array with totals
	 */
	private calculateItems(
		inputItems: CreateInvoiceItemInput[],
		currency: Currency,
		vatRate: number,
	): InvoiceItem[] {
		return inputItems.map((input) => {
			const quantity = parseFloat(input.quantity);
			const unitPrice = Money.fromAmount(parseFloat(input.unitPrice), currency);
			const taxType = input.taxType || "GRAVADO";

			// Calculate subtotal
			const subtotal = unitPrice.multiply(quantity);

			// Calculate IGV based on tax type
			let subtotalWithoutTax: Money;
			let igvAmount: Money;
			let igvRate: number;
			let totalAmount: Money;

			if (taxType === "GRAVADO") {
				igvRate = Number((vatRate * 100).toFixed(2));
				// IGV is included in the price (SUNAT standard)
				subtotalWithoutTax = subtotal.divide(1 + vatRate);
				igvAmount = subtotal.subtract(subtotalWithoutTax);
				totalAmount = subtotal;
			} else {
				// EXONERADO or INAFECTO - no IGV
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

	/**
	 * Map domain entity to API result DTO.
	 *
	 * Converts Money value objects to serializable objects.
	 *
	 * @param invoice - Persisted invoice entity
	 * @returns CreateInvoiceResult for API response
	 */
	private mapToResult(invoice: Invoice): CreateInvoiceResult {
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
}
