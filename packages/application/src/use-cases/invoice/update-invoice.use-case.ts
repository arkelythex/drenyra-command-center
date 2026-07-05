import { Invoice, type InvoiceItem } from "@drenyra/domain/entities/Invoice";
import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import { TaxCalculator } from "@drenyra/domain/services/TaxCalculator";
import { DNI } from "@drenyra/domain/value-objects/DNI";
import { DocumentSeries } from "@drenyra/domain/value-objects/DocumentSeries";
import { Money } from "@drenyra/domain/value-objects/Money";
import { RUC } from "@drenyra/domain/value-objects/RUC";
import { BusinessRuleError, NotFoundError } from "@drenyra/shared/errors";
import type {
	UpdateInvoiceDTO,
	UpdateInvoiceItemDTO,
} from "../../dtos/invoice/update-invoice.dto";
import { UpdateInvoiceSchema } from "../../validators/invoice/invoice.validators";

/**
 * UpdateInvoiceUseCase class.
 *
 * @example
 * ```ts
 * const value = new UpdateInvoiceUseCase();
 * console.log(value);
 * ```
 */
export class UpdateInvoiceUseCase {
	constructor(private readonly invoiceRepository: InvoiceRepository) {}

	async execute(input: UpdateInvoiceDTO): Promise<void> {
		const validatedInput = UpdateInvoiceSchema.parse(input);

		const existingInvoice = await this.invoiceRepository.findById(
			validatedInput.id,
		);

		if (!existingInvoice) {
			throw new NotFoundError("Invoice", validatedInput.id);
		}

		if (!existingInvoice.canBeModified()) {
			throw new BusinessRuleError(
				`Invoice ${existingInvoice.getFullNumber()} cannot be modified (status: ${existingInvoice.status})`,
			);
		}

		const series = validatedInput.series
			? DocumentSeries.create(validatedInput.series)
			: existingInvoice.series;

		const clientRUC =
			validatedInput.clientRUC !== undefined
				? validatedInput.clientRUC
					? RUC.create(validatedInput.clientRUC)
					: undefined
				: existingInvoice.clientRUC;

		const clientDNI =
			validatedInput.clientDNI !== undefined
				? validatedInput.clientDNI
					? DNI.create(validatedInput.clientDNI)
					: undefined
				: existingInvoice.clientDNI;

		let items: InvoiceItem[];
		let baseAmount: Money;
		let igvAmount: Money;
		let totalAmount: Money;
		const currency = existingInvoice.baseAmount.getCurrency();

		if (validatedInput.items) {
			items = validatedInput.items.map((item: UpdateInvoiceItemDTO) => {
				const unitPrice = Money.fromAmount(item.unitPrice, currency);
				const subtotal = unitPrice.multiply(item.quantity);
				const igvResult = TaxCalculator.calculateIGV(subtotal);
				const igv = igvResult.taxAmount;
				const total = subtotal.add(igv);

				return {
					id: item.id || crypto.randomUUID(),
					description: item.description,
					quantity: item.quantity,
					unitPrice,
					subtotal,
					igv,
					total,
				};
			});

			baseAmount = items.reduce(
				(acc, item) => acc.add(item.subtotal),
				Money.zero(currency),
			);
			igvAmount = items.reduce(
				(acc, item) => acc.add(item.igv),
				Money.zero(currency),
			);
			totalAmount = baseAmount.add(igvAmount);
		} else {
			items = [...existingInvoice.items];
			baseAmount = existingInvoice.baseAmount;
			igvAmount = existingInvoice.igvAmount;
			totalAmount = existingInvoice.totalAmount;
		}

		const updatedInvoice = Invoice.create({
			id: existingInvoice.id,
			series,
			number: validatedInput.number ?? existingInvoice.number,
			issueDate: existingInvoice.issueDate,
			dueDate:
				validatedInput.dueDate !== undefined
					? validatedInput.dueDate
					: existingInvoice.dueDate,
			clientName: validatedInput.clientName ?? existingInvoice.clientName,
			clientRUC,
			clientDNI,
			clientAddress:
				validatedInput.clientAddress !== undefined
					? validatedInput.clientAddress
					: existingInvoice.clientAddress,
			baseAmount,
			igvAmount,
			totalAmount,
			status: validatedInput.status ?? existingInvoice.status,
			items,
			createdAt: existingInvoice.createdAt,
			updatedAt: new Date(),
		});

		if (
			validatedInput.organizationId &&
			this.invoiceRepository.updateForOrganization
		) {
			await this.invoiceRepository.updateForOrganization(
				updatedInvoice,
				validatedInput.organizationId,
			);
			return;
		}

		await this.invoiceRepository.update(updatedInvoice);
	}
}
