/**
 * Get Transaction Use Case
 *
 * Retrieves a single transaction by ID for an organization.
 */

import type { Transaction } from "@drenyra/domain/entities/Transaction";
import type { TransactionRepository } from "@drenyra/domain/repositories/transaction.repository";

/**
 * GetTransactionInput interface.
 *
 * @example
 * ```ts
 * const value: GetTransactionInput = {} as GetTransactionInput;
 * console.log(value);
 * ```
 */
export interface GetTransactionInput {
	id: string;
	organizationId: number;
}

/**
 * GetTransactionOutput interface.
 *
 * @example
 * ```ts
 * const value: GetTransactionOutput = {} as GetTransactionOutput;
 * console.log(value);
 * ```
 */
export interface GetTransactionOutput {
	success: boolean;
	data?: Transaction;
	error?: string;
}

/**
 * GetTransactionUseCase class.
 *
 * @example
 * ```ts
 * const value = new GetTransactionUseCase();
 * console.log(value);
 * ```
 */
export class GetTransactionUseCase {
	constructor(private readonly transactionRepository: TransactionRepository) {}

	async execute(input: GetTransactionInput): Promise<GetTransactionOutput> {
		try {
			const { id, organizationId } = input;

			// Validate inputs
			if (!id) {
				return {
					success: false,
					error: "ID de transacción requerido",
				};
			}

			if (!organizationId || organizationId <= 0) {
				return {
					success: false,
					error: "ID de organización inválido",
				};
			}

			// Fetch transaction
			const transaction = await this.transactionRepository.findById(
				id,
				organizationId,
			);

			if (!transaction) {
				return {
					success: false,
					error: `Transacción ${id} no encontrada`,
				};
			}

			return {
				success: true,
				data: transaction,
			};
		} catch (error) {
			console.error("GetTransactionUseCase error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al obtener transacción",
			};
		}
	}
}
