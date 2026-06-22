/**
 * Create Customer Command
 *
 * Creates a new customer with RUC validation.
 *
 * @module customer/application/commands
 */

import { Customer } from "../../domain/customer";
import type {
	CreateCustomerInput,
	ICustomerRepository,
} from "../../domain/customer.repository.interface";

/**
 * Create Customer Command Handler
 *
 * Validates RUC and creates customer in businessPartners table.
 * @example
 * ```ts
 * const value = new CreateCustomerCommand();
 * console.log(value);
 * ```
 */

export class CreateCustomerCommand {
	constructor(private readonly repository?: ICustomerRepository) {}

	async execute(input: CreateCustomerInput): Promise<Customer> {
		const repository =
			this.repository ??
			new (
				await import("../../infrastructure/customer.repository")
			).CustomerRepository();

		// Validate RUC with SUNAT Módulo 11 algorithm
		if (!Customer.isValidRUC(input.taxId)) {
			throw new Error(
				"El RUC no cumple con el algoritmo de dígito verificador (Módulo 11)",
			);
		}

		const creditLimit = input.creditLimit ?? 0;
		if (creditLimit < 0) throw new Error("creditLimit must be >= 0");

		const creditDays = input.creditDays ?? 30;
		if (!Number.isInteger(creditDays) || creditDays < 0) {
			throw new Error("creditDays must be a non-negative integer");
		}

		const exists = await repository.existsByTaxId(input.companyId, input.taxId);
		if (exists)
			throw new Error("Ya existe un cliente con ese RUC en la empresa");

		return await repository.create(input);
	}
}
