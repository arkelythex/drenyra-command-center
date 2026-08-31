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
	InvoiceListFilters,
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

function toInvoiceListFilters(input: ListInvoicesInput): InvoiceListFilters {
	return {
		companyId: input.companyId,
		...(input.status !== undefined ? { status: input.status } : {}),
		...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
		...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
		...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
		...(input.minAmount !== undefined ? { minAmount: input.minAmount } : {}),
		...(input.maxAmount !== undefined ? { maxAmount: input.maxAmount } : {}),
		...(input.search !== undefined ? { search: input.search } : {}),
		limit: input.limit ?? 20,
		offset: input.offset ?? 0,
	};
}

/**
 * @deprecated Use listInvoices() function instead.
 */
export class ListInvoicesQuery {
	constructor(
		private readonly repository: IInvoiceRepository = new InvoiceRepository(),
	) {}

	async execute(input: ListInvoicesInput): Promise<InvoiceListResult> {
		return await this.repository.list(toInvoiceListFilters(input));
	}
}

export async function listInvoices(
	input: ListInvoicesInput,
): Promise<InvoiceListResult> {
	const repository = new InvoiceRepository();
	return await repository.list(toInvoiceListFilters(input));
}
