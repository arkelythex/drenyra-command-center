/**
 * Update Account Use Case
 * Orchestrates updating an existing accounting account
 * Respects business rules for system accounts
 */

import type { Account } from "@drenyra/domain/entities/Account";
import type { AccountRepository } from "@drenyra/domain/repositories/account.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import {
	type UpdateAccountDTO,
	updateAccountSchema,
} from "../../dtos/account/account.dto";

type ValidatedUpdate = ReturnType<typeof updateAccountSchema.parse>;

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

	async execute(
		scope: TenantScope,
		accountId: string,
		input: UpdateAccountDTO,
	): Promise<Account> {
		// 1. Validate input with Zod schema
		const validatedInput = updateAccountSchema.parse(input);

		// 2. Find existing account
		const existingAccount = await this.accountRepository.findById(
			scope,
			accountId,
		);
		if (!existingAccount) {
			throw new Error("Cuenta no encontrada");
		}

		// 3. If code is being changed, verify it doesn't exist
		await this.assertCodeAvailable(existingAccount, validatedInput.code);

		// 4. If parentId is being changed, verify new parent is valid
		await this.assertValidNewParent(scope, existingAccount, validatedInput);

		// 5. If changing from group to non-group, verify no children exist
		await this.assertCanBecomeMovement(scope, existingAccount, validatedInput);

		// 6. Build update data object
		const updateData = this.buildUpdateData(validatedInput);

		// 7. Update account (domain entity handles system account restrictions)
		const updatedAccount = existingAccount.update(updateData);

		// 8. Persist changes
		await this.accountRepository.update(scope, updatedAccount);

		return updatedAccount;
	}

	private async assertCodeAvailable(
		existing: Account,
		newCode: string | undefined,
	): Promise<void> {
		if (!newCode || newCode === existing.code) return;
		const codeExists = await this.accountRepository.codeExists(
			existing.organizationId,
			newCode,
			existing.id, // Exclude current account
		);
		if (codeExists) {
			throw new Error(`Ya existe una cuenta con el código ${newCode}`);
		}
	}

	private async assertValidNewParent(
		scope: TenantScope,
		existing: Account,
		input: ValidatedUpdate,
	): Promise<void> {
		if (!("parentId" in input) || input.parentId === existing.parentId) return;
		// Allow setting parentId to null (removing parent)
		if (input.parentId === null || input.parentId === undefined) return;

		const newParent = await this.accountRepository.findById(
			scope,
			input.parentId,
		);
		if (!newParent) {
			throw new Error("La nueva cuenta padre no existe");
		}
		if (!newParent.canHaveChildren()) {
			throw new Error("La nueva cuenta padre no puede tener subcuentas");
		}
		// Prevent circular reference
		if (newParent.code.startsWith(existing.code)) {
			throw new Error("No se puede asignar como padre a una subcuenta");
		}
	}

	private async assertCanBecomeMovement(
		scope: TenantScope,
		existing: Account,
		input: ValidatedUpdate,
	): Promise<void> {
		if (input.isGroup !== false || !existing.isGroup) return;
		const hasChildren = await this.accountRepository.hasChildren(
			scope,
			existing.id,
		);
		if (hasChildren) {
			throw new Error(
				"No se puede convertir en cuenta de movimiento porque tiene subcuentas",
			);
		}
	}

	private buildUpdateData(
		input: ValidatedUpdate,
	): Parameters<Account["update"]>[0] {
		const updateData: Parameters<Account["update"]>[0] = {
			name: input.name,
			description: input.description ?? undefined,
			destination: input.destination ?? undefined,
			isActive: input.isActive,
			code: input.code,
			type: input.type,
			level: input.level,
			isGroup: input.isGroup,
			currency: input.currency,
		};

		// Only set parentId if it's explicitly in the input (to allow removing parent with null)
		if ("parentId" in input) {
			updateData.parentId =
				input.parentId === null ? undefined : input.parentId;
		}
		return updateData;
	}
}
