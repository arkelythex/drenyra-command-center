/**
 * Delete Bill Command
 * Hard deletes a DRAFT bill.
 *
 * @layer Application (Command)
 * @pattern CQRS Write Model
 */

import type { IBillRepository } from "../../domain/bill.repository.interface";
import { BillRepository } from "../../infrastructure/bill.repository";

export interface DeleteBillInput {
	id: string;
}

/**
 * @deprecated Use deleteBill() function instead.
 */
export class DeleteBillCommand {
	constructor(
		private readonly repository: IBillRepository = new BillRepository(),
	) {}

	async execute(input: DeleteBillInput): Promise<void> {
		const bill = await this.repository.findById(input.id);
		if (!bill) throw new Error("Bill not found");

		if (!bill.canEdit()) {
			throw new Error("Cannot delete bill: only DRAFT bills can be deleted.");
		}

		await this.repository.delete(input.id);
	}
}

export async function deleteBill(input: DeleteBillInput): Promise<void> {
	const repository = new BillRepository();

	const bill = await repository.findById(input.id);
	if (!bill) throw new Error("Bill not found");

	if (!bill.canEdit()) {
		throw new Error("Cannot delete bill: only DRAFT bills can be deleted.");
	}

	await repository.delete(input.id);
}
