/**
 * Delete Transaction Use Case
 *
 * Deletes a transaction. Only DRAFT transactions can be deleted.
 * Posted transactions must be voided instead.
 */

import type { TransactionRepository } from "@drenyra/domain/repositories/transaction.repository";

/**
 * DeleteTransactionInput interface.
 *
 * @example
 * ```ts
 * const value: DeleteTransactionInput = {} as DeleteTransactionInput;
 * console.log(value);
 * ```
 */
export interface DeleteTransactionInput {
	id: string;
	organizationId: number;
	userId: string;
}

/**
 * DeleteTransactionOutput interface.
 *
 * @example
 * ```ts
 * const value: DeleteTransactionOutput = {} as DeleteTransactionOutput;
 * console.log(value);
 * ```
 */
export interface DeleteTransactionOutput {
	success: boolean;
	error?: string;
}

/**
 * DeleteTransactionUseCase class.
 *
 * @example
 * ```ts
 * const value = new DeleteTransactionUseCase();
 * console.log(value);
 * ```
 */
export class DeleteTransactionUseCase {
	constructor(private readonly transactionRepository: TransactionRepository) {}

	async execute(
		input: DeleteTransactionInput,
	): Promise<DeleteTransactionOutput> {
		try {
			const { id, organizationId, userId } = input;

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

			if (!userId) {
				return {
					success: false,
					error: "Usuario no autenticado",
				};
			}

			// Fetch existing transaction with tenant scope
			const scope: TenantScope = {
				organizationId: String(organizationId),
				companyId: input.companyId ?? "",
			};
			const existing = await this.transactionRepository.findById(
				scope,
				id,
			);

			if (!existing) {
				return {
					success: false,
					error: `Transacción ${id} no encontrada`,
				};
			}

			// Check if transaction can be deleted
			if (!existing.canBeModified()) {
				return {
					success: false,
					error:
						"No se puede eliminar una transacción contabilizada. Debe anularla.",
				};
			}

			// Delete transaction
			await this.transactionRepository.delete(id, organizationId);

			return {
				success: true,
			};
		} catch (error) {
			console.error("DeleteTransactionUseCase error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al eliminar transacción",
			};
		}
	}
}
