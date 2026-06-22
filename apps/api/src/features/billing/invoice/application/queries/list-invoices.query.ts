/**
 * List Invoices Query
 * Retrieves invoices with filters and pagination
 *
 * @layer Application (Query)
 * @pattern CQRS Read Model
 */

import type { InvoiceStatus } from "../../domain/invoice.entity";
import type {
	IInvoiceRepository,
	InvoiceListResult,
} from "../../domain/invoice.repository.interface";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";

export interface ListInvoicesInput {
	companyId: string;
	status?: InvoiceStatus;
	customerId?: string;
	startDate?: Date;
	endDate?: Date;
	minAmount?: number;
	maxAmount?: number;
	search?: string;
	limit?: number;
	offset?: number;
}

/**
 * @deprecated Use listInvoices() function instead.
 */
export class ListInvoicesQuery {
	constructor(
		private readonly repository: IInvoiceRepository = new InvoiceRepository(),
	) {}

	async execute(input: ListInvoicesInput): Promise<InvoiceListResult> {
		return await this.repository.list({
			companyId: input.companyId,
			status: input.status,
			customerId: input.customerId,
			startDate: input.startDate,
			endDate: input.endDate,
			minAmount: input.minAmount,
			maxAmount: input.maxAmount,
			search: input.search,
			limit: input.limit ?? 20,
			offset: input.offset ?? 0,
		});
	}
}

export async function listInvoices(
	input: ListInvoicesInput,
): Promise<InvoiceListResult> {
	const repository = new InvoiceRepository();
	return await repository.list({
		companyId: input.companyId,
		status: input.status,
		customerId: input.customerId,
		startDate: input.startDate,
		endDate: input.endDate,
		minAmount: input.minAmount,
		maxAmount: input.maxAmount,
		search: input.search,
		limit: input.limit ?? 20,
		offset: input.offset ?? 0,
	});
}
