/**
 * Get Invoice Query
 * Retrieves a single invoice by ID
 *
 * @layer Application (Query)
 * @pattern CQRS Read Model
 */

import type { Invoice } from "../../domain/invoice.entity";
import type { IInvoiceRepository } from "../../domain/invoice.repository.interface";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";

export interface GetInvoiceInput {
	id: string;
}

/**
 * @deprecated Use getInvoice() function instead.
 */
export class GetInvoiceQuery {
	constructor(
		private readonly repository: IInvoiceRepository = new InvoiceRepository(),
	) {}

	async execute(input: GetInvoiceInput): Promise<Invoice | null> {
		return await this.repository.findById(input.id);
	}
}

export async function getInvoice(
	input: GetInvoiceInput,
): Promise<Invoice | null> {
	const repository = new InvoiceRepository();
	return await repository.findById(input.id);
}
