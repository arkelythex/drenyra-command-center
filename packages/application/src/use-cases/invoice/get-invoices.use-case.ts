import type { Invoice } from "@arkelythex/domain/entities/Invoice";
import type { InvoiceRepository } from "@arkelythex/domain/repositories/invoice.repository";

/**
 * GetInvoicesUseCase class.
 *
 * @example
 * ```ts
 * const value = new GetInvoicesUseCase();
 * console.log(value);
 * ```
 */
export class GetInvoicesUseCase {
	constructor(private readonly invoiceRepository: InvoiceRepository) {}

	async execute(): Promise<Invoice[]> {
		return this.invoiceRepository.findAll();
	}
}
