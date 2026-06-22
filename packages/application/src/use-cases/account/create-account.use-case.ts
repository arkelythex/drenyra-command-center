/**
 * Create Account Use Case
 * Orchestrates the creation of a new accounting account
 */

import { randomUUID } from "crypto";
import {
	type CreateAccountDTO,
	createAccountSchema,
} from "../../dtos/account/account.dto";
import { Account } from "@arkelythex/domain/entities/Account";
import type { AccountRepository } from "@arkelythex/domain/repositories/account.repository";
import { Money } from "@arkelythex/domain/value-objects/Money";

/**
 * CreateAccountUseCase class.
 *
 * @example
 * ```ts
 * const value = new CreateAccountUseCase();
 * console.log(value);
 * ```
 */
export class CreateAccountUseCase {
	constructor(private readonly accountRepository: AccountRepository) {}

	async execute(input: CreateAccountDTO): Promise<Account> {
		// 1. Validate input with Zod schema
		const validatedInput = createAccountSchema.parse(input);

		// 2. Check if code already exists
		const existingAccount = await this.accountRepository.codeExists(
			validatedInput.organizationId,
			validatedInput.code,
		);

		if (existingAccount) {
			throw new Error(
				`Ya existe una cuenta con el código ${validatedInput.code}`,
			);
		}

		// 3. If parentId provided, verify parent exists and can have children
		if (validatedInput.parentId) {
			const parent = await this.accountRepository.findById(
				validatedInput.parentId,
			);
			if (!parent) {
				throw new Error("La cuenta padre no existe");
			}
			if (!parent.canHaveChildren()) {
				throw new Error("La cuenta padre no puede tener subcuentas");
			}
			// Validate parent code is prefix of child code
			if (!validatedInput.code.startsWith(parent.code)) {
				throw new Error(
					"El código debe comenzar con el código de la cuenta padre",
				);
			}
		}

		// 4. Create account entity
		const account = Account.create({
			id: randomUUID(),
			organizationId: validatedInput.organizationId,
			code: validatedInput.code,
			name: validatedInput.name,
			description: validatedInput.description,
			level: validatedInput.level,
			type: validatedInput.type,
			parentId: validatedInput.parentId,
			isGroup: validatedInput.isGroup,
			isActive: true,
			isSystem: validatedInput.isSystem,
			currency: validatedInput.currency,
			destination: validatedInput.destination,
			balance: Money.fromAmount(0, "PEN"),
			balanceUSD: Money.fromAmount(0, "USD"),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// 5. Persist to database
		await this.accountRepository.save(account);

		return account;
	}
}
