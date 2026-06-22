/**
 * Customer Feature - Public Exports
 *
 * @module customers
 */

// API Routes
export {
	customerRoutes,
	customerRoutes as customersModule,
} from "./api/routes";

// Commands
export { CreateCustomerCommand } from "./application/commands/create-customer.command";
export { DeleteCustomerCommand } from "./application/commands/delete-customer.command";
export { UpdateCustomerCommand } from "./application/commands/update-customer.command";

// Queries
export { GetCustomerQuery } from "./application/queries/get-customer.query";
export { ListCustomersQuery } from "./application/queries/list-customers.query";
export type { CustomerData } from "./domain/customer";
// Domain
export { Customer } from "./domain/customer";
export type {
	CreateCustomerInput,
	CustomerListFilters,
	CustomerSegment,
	ICustomerRepository,
	UpdateCustomerInput,
} from "./domain/customer.repository.interface";

// Infrastructure
export { CustomerRepository } from "./infrastructure/customer.repository";
