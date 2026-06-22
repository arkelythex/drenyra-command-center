/**
 * Update Customer Command
 *
 * Updates an existing customer.
 *
 * @module customer/application/commands
 */

import { Customer } from "../../domain/customer";
import type {
	ICustomerRepository,
	UpdateCustomerInput,
} from "../../domain/customer.repository.interface";

/**
 * Update Customer Command Handler
 *
 * Updates customer fields. If taxId changes, validates RUC.
 * @example
 * ```ts
 * const value = new UpdateCustomerCommand();
 * console.log(value);
 * ```
 */

export class UpdateCustomerCommand {
	constructor(private readonly repository?: ICustomerRepository) {}

	async execute(input: UpdateCustomerInput): Promise<Customer> {
		const repository =
			this.repository ??
			new (
				await import("../../infrastructure/customer.repository")
			).CustomerRepository();

		// If taxId is being updated, validate it
		if (input.taxId && !Customer.isValidRUC(input.taxId)) {
			throw new Error(
				"El RUC no cumple con el algoritmo de dígito verificador (Módulo 11)",
			);
		}

		if (input.creditLimit !== undefined && input.creditLimit < 0)
			throw new Error("creditLimit must be >= 0");
		if (
			input.creditDays !== undefined &&
			(!Number.isInteger(input.creditDays) || input.creditDays < 0)
		) {
			throw new Error("creditDays must be a non-negative integer");
		}

		return await repository.update(input);
	}
}
