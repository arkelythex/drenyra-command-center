/**
 * Delete Customer Command
 *
 * Soft-deletes a customer (marks as INACTIVO).
 *
 * @module customer/application/commands
 */

import type { Customer } from "../../domain/customer";
import type { ICustomerRepository } from "../../domain/customer.repository.interface";

/**
 * DeleteCustomerInput interface.
 *
 * @example
 * ```ts
 * const value: DeleteCustomerInput = {} as DeleteCustomerInput;
 * console.log(value);
 * ```
 */
export interface DeleteCustomerInput {
	id: string;
	companyId: string;
}

/**
 * Delete Customer Command Handler
 *
 * Performs soft delete by marking customer as INACTIVO.
 * Customer records are never physically deleted for audit purposes.
 *
 * @param input - Customer identifier and company scope required for tenant isolation.
 * @returns The soft-deleted customer aggregate.
 * @throws Error when the customer does not exist within the provided company scope.
 * @example
 * ```ts
 * const value = new DeleteCustomerCommand();
 * console.log(value);
 * ```
 */

export class DeleteCustomerCommand {
	constructor(private readonly repository?: ICustomerRepository) {}

	async execute(input: DeleteCustomerInput): Promise<Customer> {
		const repository =
			this.repository ??
			new (
				await import("../../infrastructure/customer.repository")
			).CustomerRepository();
		return await repository.softDelete(input.id, input.companyId);
	}
}
