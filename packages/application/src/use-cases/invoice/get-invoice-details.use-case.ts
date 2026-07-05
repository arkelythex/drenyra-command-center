import type { Invoice } from "@drenyra/domain/entities/Invoice";
import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";

/**
 * Get Invoice Details Use Case
 *
 * Returns a single invoice by ID with all its details
 * @example
 * ```ts
 * const value = new GetInvoiceDetailsUseCase();
 * console.log(value);
 * ```
 */

export class GetInvoiceDetailsUseCase {
	constructor(private readonly invoiceRepository: InvoiceRepository) {}

	async execute(invoiceId: string): Promise<Invoice> {
		const invoice = await this.invoiceRepository.findById(invoiceId);

		if (!invoice) {
			throw new Error(`Invoice with ID ${invoiceId} not found`);
		}

		return invoice;
	}
}
