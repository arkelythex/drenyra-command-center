/**
 * Bill Feature - Barrel Export
 *
 * Vertical Slice Architecture entry point.
 * Exports public API for other features to consume.
 */

// API Routes
export { billRoutes } from "./api/routes";
export {
	ApplyPaymentCommand,
	applyPayment,
} from "./application/commands/apply-payment.command";
// Commands (class-based - legacy)
// Commands (function-based)
export {
	CreateBillCommand,
	type CreateBillResult,
	createBill,
} from "./application/commands/create-bill.command";
export { CreateBillHandler } from "./application/commands/create-bill.handler";
export {
	DeleteBillCommand,
	deleteBill,
} from "./application/commands/delete-bill.command";
// Queries (class-based - legacy)
// Queries (function-based)
export { GetBillQuery, getBill } from "./application/queries/get-bill.query";
export {
	ListBillsQuery,
	listBills,
} from "./application/queries/list-bills.query";
// Query Service used by Banking reconciliation
export { BillQueryService } from "./application/services/bill.query-service";
// Domain
export { Bill, type BillItem, type BillStatus } from "./domain/bill.entity";
export type {
	BillListFilters,
	BillListResult,
	IBillRepository,
} from "./domain/bill.repository.interface";
// Infrastructure
export { BillRepository } from "./infrastructure/bill.repository";
