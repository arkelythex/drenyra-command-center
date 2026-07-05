import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import { BusinessRuleError, NotFoundError } from "@drenyra/shared/errors";
import type { DeleteInvoiceDTO } from "../../dtos/invoice/delete-invoice.dto";
import { DeleteInvoiceSchema } from "../../validators/invoice/invoice.validators";

/**
 * DeleteInvoiceUseCase class.
 *
 * @example
 * ```ts
 * const value = new DeleteInvoiceUseCase();
 * console.log(value);
 * ```
 */
export class DeleteInvoiceUseCase {
	constructor(private readonly invoiceRepository: InvoiceRepository) {}

	async execute(input: DeleteInvoiceDTO): Promise<void> {
		const validatedInput = DeleteInvoiceSchema.parse(input);

		const invoice = await this.invoiceRepository.findById(validatedInput.id);

		if (!invoice) {
			throw new NotFoundError("Invoice", validatedInput.id);
		}

		if (invoice.status === "SENT" || invoice.status === "ACCEPTED") {
			throw new BusinessRuleError(
				`Cannot delete invoice ${invoice.getFullNumber()} (status: ${invoice.status}). ` +
					"Use Nota de Crédito to reverse this invoice.",
			);
		}

		if (invoice.status === "PENDING") {
			throw new BusinessRuleError(
				`Cannot delete invoice ${invoice.getFullNumber()} in PENDING status. ` +
					"Cancel it first or change status to DRAFT.",
			);
		}

		if (invoice.status !== "DRAFT" && invoice.status !== "CANCELLED") {
			throw new BusinessRuleError(
				`Invoice ${invoice.getFullNumber()} cannot be deleted (status: ${invoice.status})`,
			);
		}

		await this.invoiceRepository.delete(validatedInput.id);
	}
}
