import { toInvoiceResponseDTO } from "../../dtos/invoice/invoice-response.dto";
import type {
	ListInvoicesDTO,
	ListInvoicesResponseDTO,
} from "../../dtos/invoice/list-invoices.dto";
import type { Invoice } from "@arkelythex/domain/entities/Invoice";
import type {
	InvoiceFilters,
	InvoiceRepository,
} from "@arkelythex/domain/repositories/invoice.repository";

/**
 * List Invoices Use Case
 *
 * Supports:
 * - Pagination
 * - Filtering by status, client, date range, amount
 * - Sorting
 * @example
 * ```ts
 * const value = new ListInvoicesUseCase();
 * console.log(value);
 * ```
 */

export class ListInvoicesUseCase {
	constructor(private readonly invoiceRepository: InvoiceRepository) {}

	async execute(input: ListInvoicesDTO): Promise<ListInvoicesResponseDTO> {
		// 1. Set defaults
		const page = input.page || 1;
		const limit = input.limit || 20;

		// 2. Build filters
		const filters: InvoiceFilters = {
			status: input.status,
			clientName: input.clientName,
			clientRUC: input.clientRUC,
			series: input.series,
			dateFrom: input.dateFrom,
			dateTo: input.dateTo,
			minAmount: input.minAmount,
			maxAmount: input.maxAmount,
		};

		// 3. Get invoices and total count
		const [invoices, total] = await Promise.all([
			this.invoiceRepository.findAll(filters),
			this.invoiceRepository.count(filters),
		]);

		// 4. Apply sorting (in-memory for now, should be done in repository)
		const sortedInvoices = this.sortInvoices(
			invoices,
			input.sortBy,
			input.sortOrder,
		);

		// 5. Apply pagination (in-memory for now, should be done in repository)
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex);

		// 6. Map to DTOs
		const invoiceDTOs = paginatedInvoices.map(toInvoiceResponseDTO);

		// 7. Calculate pagination metadata
		const totalPages = Math.ceil(total / limit);

		return {
			invoices: invoiceDTOs,
			total,
			page,
			limit,
			totalPages,
		};
	}

	private sortInvoices(
		invoices: Invoice[],
		sortBy?: "issueDate" | "totalAmount" | "clientName" | "number",
		sortOrder?: "asc" | "desc",
	): Invoice[] {
		if (!sortBy) {
			return invoices;
		}

		const sorted = [...invoices].sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case "issueDate":
					comparison = a.issueDate.getTime() - b.issueDate.getTime();
					break;
				case "totalAmount":
					comparison = a.totalAmount.getAmount() - b.totalAmount.getAmount();
					break;
				case "clientName":
					comparison = a.clientName.localeCompare(b.clientName);
					break;
				case "number":
					comparison = a.number - b.number;
					break;
			}

			return sortOrder === "desc" ? -comparison : comparison;
		});

		return sorted;
	}
}
