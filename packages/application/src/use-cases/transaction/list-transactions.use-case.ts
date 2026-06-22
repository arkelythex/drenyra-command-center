/**
 * List Transactions Use Case
 *
 * Retrieves a paginated list of transactions for an organization
 * with optional filters.
 */

import type { Transaction } from "@arkelythex/domain/entities/Transaction";
import type {
	PaginatedResult,
	PaginationOptions,
	TransactionFilters,
	TransactionRepository,
} from "@arkelythex/domain/repositories/transaction.repository";

/**
 * ListTransactionsInput interface.
 *
 * @example
 * ```ts
 * const value: ListTransactionsInput = {} as ListTransactionsInput;
 * console.log(value);
 * ```
 */
export interface ListTransactionsInput {
	organizationId: number;
	filters?: TransactionFilters;
	pagination?: PaginationOptions;
}

/**
 * ListTransactionsOutput interface.
 *
 * @example
 * ```ts
 * const value: ListTransactionsOutput = {} as ListTransactionsOutput;
 * console.log(value);
 * ```
 */
export interface ListTransactionsOutput {
	success: boolean;
	data?: PaginatedResult<Transaction>;
	error?: string;
}

/**
 * ListTransactionsUseCase class.
 *
 * @example
 * ```ts
 * const value = new ListTransactionsUseCase();
 * console.log(value);
 * ```
 */
export class ListTransactionsUseCase {
	constructor(private readonly transactionRepository: TransactionRepository) {}

	async execute(input: ListTransactionsInput): Promise<ListTransactionsOutput> {
		try {
			const { organizationId, filters, pagination } = input;

			// Validate organization ID
			if (!organizationId || organizationId <= 0) {
				return {
					success: false,
					error: "ID de organización inválido",
				};
			}

			// Set default pagination if not provided
			const paginationOptions: PaginationOptions = {
				page: pagination?.page || 1,
				limit: Math.min(pagination?.limit || 20, 100), // Max 100 items per page
			};

			// Fetch transactions
			const result = await this.transactionRepository.findAll(
				organizationId,
				filters,
				paginationOptions,
			);

			return {
				success: true,
				data: result,
			};
		} catch (error) {
			console.error("ListTransactionsUseCase error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al listar transacciones",
			};
		}
	}
}
