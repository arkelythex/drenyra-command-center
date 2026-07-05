/**
 * Get Customer Query
 *
 * Returns a single customer with optional invoice history.
 *
 * @module customer/application/queries
 */

import { db } from "@drenyra/persistence/client";
import { and, desc, eq } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";
import type { Customer } from "../../domain/customer";
import type { ICustomerRepository } from "../../domain/customer.repository.interface";

/**
 * GetCustomerInput interface.
 *
 * @example
 * ```ts
 * const value: GetCustomerInput = {} as GetCustomerInput;
 * console.log(value);
 * ```
 */
export interface GetCustomerInput {
	id: string;
	companyId: string;
	includeInvoices?: boolean; // Default: false
	invoiceLimit?: number; // Default: 10
}

/**
 * GetCustomerResult interface.
 *
 * @example
 * ```ts
 * const value: GetCustomerResult = {} as GetCustomerResult;
 * console.log(value);
 * ```
 */
export interface GetCustomerResult {
	customer: Customer;
	invoices?: Array<{
		id: string;
		invoiceNumber: string;
		issueDate: Date;
		dueDate: Date;
		totalAmount: number;
		status: string;
	}>;
}

/**
 * Get Customer Query Handler
 *
 * Retrieves a single customer by ID.
 * Optionally includes recent invoice history.
 *
 * @param input - Customer identifier, company scope, and optional invoice history options.
 * @returns The scoped customer and optional company-scoped invoice history.
 * @throws Error when the customer does not exist within the provided company scope.
 * @example
 * ```ts
 * const value = new GetCustomerQuery();
 * console.log(value);
 * ```
 */

export class GetCustomerQuery {
	constructor(private readonly repository?: ICustomerRepository) {}

	async execute(input: GetCustomerInput): Promise<GetCustomerResult> {
		const { id, companyId, includeInvoices = false, invoiceLimit = 10 } = input;

		const repository =
			this.repository ??
			new (
				await import("../../infrastructure/customer.repository")
			).CustomerRepository();
		const customer = await repository.findByIdForCompany(id, companyId);
		if (!customer) throw new Error("Cliente no encontrado");

		// Optionally fetch invoice history
		let invoiceHistory: GetCustomerResult["invoices"];

		if (includeInvoices) {
			const invoiceRows = await db
				.select({
					id: invoices.id,
					invoiceNumber: invoices.invoiceNumber,
					issueDate: invoices.issueDate,
					dueDate: invoices.dueDate,
					totalAmount: invoices.totalAmount,
					status: invoices.status,
				})
				.from(invoices)
				.where(
					and(eq(invoices.customerId, id), eq(invoices.companyId, companyId)),
				)
				.orderBy(desc(invoices.createdAt))
				.limit(invoiceLimit);

			invoiceHistory = invoiceRows.map((row) => ({
				id: row.id,
				invoiceNumber: row.invoiceNumber,
				issueDate: row.issueDate,
				dueDate: row.dueDate,
				totalAmount: Number(row.totalAmount),
				status: row.status,
			}));
		}

		return {
			customer,
			invoices: invoiceHistory,
		};
	}
}
