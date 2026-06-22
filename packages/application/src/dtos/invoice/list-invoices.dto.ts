/**
 * ListInvoicesDTO interface.
 *
 * @example
 * ```ts
 * const value: ListInvoicesDTO = {} as ListInvoicesDTO;
 * console.log(value);
 * ```
 */
export interface ListInvoicesDTO {
	// Pagination
	page?: number;
	limit?: number;

	// Filters
	status?: "DRAFT" | "PENDING" | "SENT" | "ACCEPTED" | "REJECTED";
	clientName?: string;
	clientRUC?: string;
	series?: string;
	dateFrom?: Date;
	dateTo?: Date;
	minAmount?: number;
	maxAmount?: number;

	// Sorting
	sortBy?: "issueDate" | "totalAmount" | "clientName" | "number";
	sortOrder?: "asc" | "desc";
}

import type { InvoiceResponseDTO } from "./invoice-response.dto";

/**
 * ListInvoicesResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: ListInvoicesResponseDTO = {} as ListInvoicesResponseDTO;
 * console.log(value);
 * ```
 */
export interface ListInvoicesResponseDTO {
	invoices: InvoiceResponseDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
