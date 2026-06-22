/**
 * Delete Invoice Command
 * Hard deletes a DRAFT invoice
 *
 * @layer Application (Command)
 * @pattern CQRS Write Model
 */

import type { IInvoiceRepository } from "../../domain/invoice.repository.interface";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";

export interface DeleteInvoiceInput {
	id: string;
}

/**
 * @deprecated Use deleteInvoice() function instead.
 */
export class DeleteInvoiceCommand {
	constructor(
		private readonly repository: IInvoiceRepository = new InvoiceRepository(),
	) {}

	async execute(input: DeleteInvoiceInput): Promise<void> {
		const invoice = await this.repository.findById(input.id);
		if (!invoice) {
			throw new Error("Invoice not found");
		}

		if (!invoice.canEdit()) {
			throw new Error(
				"Cannot delete invoice: only DRAFT invoices can be deleted. Use Credit Note for sent invoices.",
			);
		}

		await this.repository.delete(input.id);
	}
}

export async function deleteInvoice(input: DeleteInvoiceInput): Promise<void> {
	const repository = new InvoiceRepository();

	const invoice = await repository.findById(input.id);
	if (!invoice) {
		throw new Error("Invoice not found");
	}

	if (!invoice.canEdit()) {
		throw new Error(
			"Cannot delete invoice: only DRAFT invoices can be deleted. Use Credit Note for sent invoices.",
		);
	}

	await repository.delete(input.id);
}
