/**
 * Get Bill Query
 * Retrieves a single bill by ID.
 *
 * @layer Application (Query)
 * @pattern CQRS Read Model
 */

import type { Bill } from "../../domain/bill.entity";
import type { IBillRepository } from "../../domain/bill.repository.interface";
import { BillRepository } from "../../infrastructure/bill.repository";

export interface GetBillInput {
	id: string;
}

/**
 * @deprecated Use getBill() function instead.
 */
export class GetBillQuery {
	constructor(
		private readonly repository: IBillRepository = new BillRepository(),
	) {}

	async execute(input: GetBillInput): Promise<Bill | null> {
		return await this.repository.findById(input.id);
	}
}

export async function getBill(input: GetBillInput): Promise<Bill | null> {
	const repository = new BillRepository();
	return await repository.findById(input.id);
}
