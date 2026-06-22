/**
 * List Customers Query
 *
 * Returns a list of customers for a company.
 *
 * @module customer/application/queries
 */

import type { Customer } from "../../domain/customer";
import type {
	CustomerListFilters,
	ICustomerRepository,
} from "../../domain/customer.repository.interface";

/**
 * List Customers Query Handler
 *
 * Retrieves all customers for a company, ordered by creation date.
 * By default, only active customers (HABIDO) are returned.
 * @example
 * ```ts
 * const value = new ListCustomersQuery();
 * console.log(value);
 * ```
 */

export class ListCustomersQuery {
	constructor(private readonly repository?: ICustomerRepository) {}

	async execute(filters: CustomerListFilters): Promise<Customer[]> {
		const repository =
			this.repository ??
			new (
				await import("../../infrastructure/customer.repository")
			).CustomerRepository();
		return await repository.list(filters);
	}
}
