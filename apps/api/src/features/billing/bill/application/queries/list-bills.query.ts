/**
 * List Bills Query
 * Lists bills with filters and pagination.
 *
 * @layer Application (Query)
 * @pattern CQRS Read Model
 */

import type { BillStatus } from "../../domain/bill.entity";
import type {
	BillListResult,
	IBillRepository,
} from "../../domain/bill.repository.interface";
import { BillRepository } from "../../infrastructure/bill.repository";

export interface ListBillsInput {
	companyId: string;
	status?: BillStatus;
	vendorId?: string;
	startDate?: Date;
	endDate?: Date;
	search?: string;
	limit?: number;
	offset?: number;
}

/**
 * @deprecated Use listBills() function instead.
 */
export class ListBillsQuery {
	constructor(
		private readonly repository: IBillRepository = new BillRepository(),
	) {}

	async execute(input: ListBillsInput): Promise<BillListResult> {
		return await this.repository.list({
			companyId: input.companyId,
			...(input.status !== undefined ? { status: input.status } : {}),
			...(input.vendorId !== undefined ? { vendorId: input.vendorId } : {}),
			...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
			...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
			...(input.search !== undefined ? { search: input.search } : {}),
			limit: input.limit ?? 20,
			offset: input.offset ?? 0,
		});
	}
}

export async function listBills(
	input: ListBillsInput,
): Promise<BillListResult> {
	const repository = new BillRepository();
	return await repository.list({
		companyId: input.companyId,
		...(input.status !== undefined ? { status: input.status } : {}),
		...(input.vendorId !== undefined ? { vendorId: input.vendorId } : {}),
		...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
		...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
		...(input.search !== undefined ? { search: input.search } : {}),
		limit: input.limit ?? 20,
		offset: input.offset ?? 0,
	});
}
