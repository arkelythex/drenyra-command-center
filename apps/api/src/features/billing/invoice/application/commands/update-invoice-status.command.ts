/**
 * Update Invoice Status Command
 * Sets invoice status (lightweight operation).
 *
 * @layer Application (Command)
 * @pattern CQRS Write Model
 */

import type { InvoiceStatus } from "../../domain/invoice.entity";
import type { IInvoiceRepository } from "../../domain/invoice.repository.interface";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";

export interface UpdateInvoiceStatusInput {
	id: string;
	status: InvoiceStatus;
	legacyUserId?: string;
}

/**
 * @deprecated Use updateInvoiceStatus() function instead.
 */
export class UpdateInvoiceStatusCommand {
	constructor(
		private readonly repository: IInvoiceRepository = new InvoiceRepository(),
	) {}

	async execute(input: UpdateInvoiceStatusInput): Promise<void> {
		const existing = await this.repository.findById(input.id);
		if (!existing) {
			throw new Error("Invoice not found");
		}

		await this.repository.updateStatus(
			input.id,
			input.status,
			input.legacyUserId,
		);
	}
}

export async function updateInvoiceStatus(
	input: UpdateInvoiceStatusInput,
): Promise<void> {
	const repository = new InvoiceRepository();

	const existing = await repository.findById(input.id);
	if (!existing) {
		throw new Error("Invoice not found");
	}

	await repository.updateStatus(input.id, input.status, input.legacyUserId);
}
