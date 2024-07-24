import type { Invoice } from "@drenyra/domain/entities/Invoice";
import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import type { TenantScope } from "@drenyra/domain/scope";

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

	async execute(scope: TenantScope, invoiceId: string): Promise<Invoice> {
		const invoice = await this.invoiceRepository.findById(scope, invoiceId);

		if (!invoice) {
			throw new Error(`Invoice with ID ${invoiceId} not found`);
		}

		return invoice;
	}
}
