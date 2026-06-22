import type {
	CreateInvoiceDTO,
	CreateInvoiceItemDTO,
} from "../../dtos/invoice/create-invoice.dto";
import { CreateInvoiceSchema } from "../../validators/invoice/invoice.validators";
import { Invoice, type InvoiceItem } from "@arkelythex/domain/entities/Invoice";
import type { InvoiceRepository } from "@arkelythex/domain/repositories/invoice.repository";
import { TaxCalculator } from "@arkelythex/domain/services/TaxCalculator";
import { DNI } from "@arkelythex/domain/value-objects/DNI";
import { DocumentSeries } from "@arkelythex/domain/value-objects/DocumentSeries";
import { Money } from "@arkelythex/domain/value-objects/Money";
import { RUC } from "@arkelythex/domain/value-objects/RUC";

/**
 * Use case for creating a new Electronic Invoice (CPE).
 *
 * @description This use case handles the orchestrating logic for creating a
 * Peruvian invoice (Factura or Boleta). It performs validation through Zod,
 * calculates taxes (IGV) via the TaxCalculator domain service, converts amounts
 * to immutable Money value objects, and persists the final Invoice entity.
 *
 * @see {@link Invoice} for the domain model.
 * @see {@link TaxCalculator} for the tax logic.
 * @since 1.0.0
 * @example
 * ```ts
 * const value = new CreateInvoiceUseCase();
 * console.log(value);
 * ```
 */

export class CreateInvoiceUseCase {
	/**
	 * Initializes the use case with its dependencies.
	 *
	 * @param {InvoiceRepository} invoiceRepository - Port for invoice persistence.
	 */
	constructor(private readonly invoiceRepository: InvoiceRepository) {}

	/**
	 * Executes the invoice creation workflow.
	 *
	 * @description Steps:
	 * 1. Validates the raw input DTO using `CreateInvoiceSchema`.
	 * 2. Initializes domain value objects (Series, RUC, DNI).
	 * 3. Iteratively calculates subtotals, IGV (18%), and totals per item.
	 * 4. Aggregates totals to form the parent Invoice.
	 * 5. Saves the resulting entity to the repository.
	 *
	 * @param {CreateInvoiceDTO} input - The raw data from the controller/action.
	 * @param {string} input.series - Documents series (e.g., F001).
	 * @param {number} input.number - Sequential number.
	 * @param {'PEN' | 'USD'} input.currency - Currency of the transaction.
	 * @param {Array<CreateInvoiceItemDTO>} input.items - List of invoice lines.
	 *
	 * @returns {Promise<void>} Resolves when the invoice is successfully created and saved.
	 *
	 * @throws {ZodError} If the input data fails validation.
	 * @throws {Error} If business rules (RUC requirements, total mismatches) are violated.
	 *
	 * @example
	 * const useCase = new CreateInvoiceUseCase(repo);
	 * await useCase.execute({
	 *   series: 'F001',
	 *   number: 101,
	 *   issueDate: new Date(),
	 *   clientName: 'Google Peru',
	 *   clientRUC: '20546296564',
	 *   currency: 'PEN',
	 *   items: [{ description: 'DevOps', quantity: 1, unitPrice: 5000 }]
	 * });
	 */
	async execute(input: CreateInvoiceDTO): Promise<void> {
		const validatedInput = CreateInvoiceSchema.parse(input);

		const series = DocumentSeries.create(validatedInput.series);
		const clientRUC = validatedInput.clientRUC
			? RUC.create(validatedInput.clientRUC)
			: undefined;
		const clientDNI = validatedInput.clientDNI
			? DNI.create(validatedInput.clientDNI)
			: undefined;

		const items: InvoiceItem[] = validatedInput.items.map(
			(item: CreateInvoiceItemDTO) => {
				const unitPrice = Money.fromAmount(
					item.unitPrice,
					validatedInput.currency,
				);
				const subtotal = unitPrice.multiply(item.quantity);

				const igvResult = TaxCalculator.calculateIGV(subtotal);
				const igv = igvResult.taxAmount;
				const total = subtotal.add(igv);

				return {
					id: crypto.randomUUID(),
					description: item.description,
					quantity: item.quantity,
					unitPrice,
					subtotal,
					igv,
					total,
				};
			},
		);

		const baseAmount = items.reduce(
			(acc, item) => acc.add(item.subtotal),
			Money.zero(validatedInput.currency),
		);
		const igvAmount = items.reduce(
			(acc, item) => acc.add(item.igv),
			Money.zero(validatedInput.currency),
		);
		const totalAmount = baseAmount.add(igvAmount);

		const invoice = Invoice.create({
			id: crypto.randomUUID(),
			series,
			number: validatedInput.number,
			issueDate: validatedInput.issueDate,
			dueDate: validatedInput.dueDate,
			clientName: validatedInput.clientName,
			clientRUC,
			clientDNI,
			clientAddress: validatedInput.clientAddress,
			baseAmount,
			igvAmount,
			totalAmount,
			status: "DRAFT",
			items,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		if (
			validatedInput.organizationId &&
			this.invoiceRepository.saveForOrganization
		) {
			await this.invoiceRepository.saveForOrganization(
				invoice,
				validatedInput.organizationId,
			);
			return;
		}

		await this.invoiceRepository.save(invoice);
	}
}
