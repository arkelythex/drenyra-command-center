/**
 * Update Account Use Case
 * Orchestrates updating an existing accounting account
 * Respects business rules for system accounts
 */

import type { Account } from "@drenyra/domain/entities/Account";
import type { AccountRepository } from "@drenyra/domain/repositories/account.repository";
import {
	type UpdateAccountDTO,
	updateAccountSchema,
} from "../../dtos/account/account.dto";

/**
 * UpdateAccountUseCase class.
 *
 * @example
 * ```ts
 * const value = new UpdateAccountUseCase();
 * console.log(value);
 * ```
 */
export class UpdateAccountUseCase {
	constructor(private readonly accountRepository: AccountRepository) {}

	async execute(accountId: string, input: UpdateAccountDTO): Promise<Account> {
		// 1. Validate input with Zod schema
		const validatedInput = updateAccountSchema.parse(input);

		// 2. Find existing account
		const existingAccount = await this.accountRepository.findById(accountId);
		if (!existingAccount) {
			throw new Error("Cuenta no encontrada");
		}

		// 3. If code is being changed, verify it doesn't exist
		if (validatedInput.code && validatedInput.code !== existingAccount.code) {
			const codeExists = await this.accountRepository.codeExists(
				existingAccount.organizationId,
				validatedInput.code,
				accountId, // Exclude current account
			);

			if (codeExists) {
				throw new Error(
					`Ya existe una cuenta con el código ${validatedInput.code}`,
				);
			}
		}

		// 4. If parentId is being changed, verify new parent is valid
		if (
			"parentId" in validatedInput &&
			validatedInput.parentId !== existingAccount.parentId
		) {
			// Allow setting parentId to null (removing parent)
			if (
				validatedInput.parentId !== null &&
				validatedInput.parentId !== undefined
			) {
				const newParent = await this.accountRepository.findById(
					validatedInput.parentId,
				);
				if (!newParent) {
					throw new Error("La nueva cuenta padre no existe");
				}
				if (!newParent.canHaveChildren()) {
					throw new Error("La nueva cuenta padre no puede tener subcuentas");
				}
				// Prevent circular reference
				if (newParent.code.startsWith(existingAccount.code)) {
					throw new Error("No se puede asignar como padre a una subcuenta");
				}
			}
		}

		// 5. If changing from group to non-group, verify no children exist
		if (validatedInput.isGroup === false && existingAccount.isGroup) {
			const hasChildren = await this.accountRepository.hasChildren(accountId);
			if (hasChildren) {
				throw new Error(
					"No se puede convertir en cuenta de movimiento porque tiene subcuentas",
				);
			}
		}

		// 6. Build update data object
		const updateData: Parameters<typeof existingAccount.update>[0] = {
			name: validatedInput.name,
			description: validatedInput.description ?? undefined,
			destination: validatedInput.destination ?? undefined,
			isActive: validatedInput.isActive,
			code: validatedInput.code,
			type: validatedInput.type,
			level: validatedInput.level,
			isGroup: validatedInput.isGroup,
			currency: validatedInput.currency,
		};

		// Only set parentId if it's explicitly in the input (to allow removing parent with null)
		if ("parentId" in validatedInput) {
			updateData.parentId =
				validatedInput.parentId === null ? undefined : validatedInput.parentId;
		}

		// 7. Update account (domain entity handles system account restrictions)
		const updatedAccount = existingAccount.update(updateData);

		// 8. Persist changes
		await this.accountRepository.save(updatedAccount);

		return updatedAccount;
	}
}
