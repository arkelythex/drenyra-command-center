/**
 * Invoice Feature - Barrel Export
 *
 * Vertical Slice Architecture entry point.
 * Exports public API for other features to consume.
 */

// API Routes
export { invoiceRoutes } from "./api/routes";
export {
	ApplyPaymentCommand,
	applyInvoicePayment,
} from "./application/commands/apply-payment.command";
// Commands (class-based - legacy)
// Commands (function-based)
export {
	CreateInvoiceCommand,
	type CreateInvoiceResult,
	createInvoice,
} from "./application/commands/create-invoice.command";
export { CreateInvoiceHandler } from "./application/commands/create-invoice.handler";
export {
	DeleteInvoiceCommand,
	deleteInvoice,
} from "./application/commands/delete-invoice.command";
export {
	UpdateInvoiceCommand,
	updateInvoice,
} from "./application/commands/update-invoice.command";
export {
	UpdateInvoiceStatusCommand,
	updateInvoiceStatus,
} from "./application/commands/update-invoice-status.command";
// Queries (class-based - legacy)
// Queries (function-based)
export {
	GetInvoiceQuery,
	getInvoice,
} from "./application/queries/get-invoice.query";
export {
	ListInvoicesQuery,
	listInvoices,
} from "./application/queries/list-invoices.query";
// Legacy Query Service (will be deprecated after banking migration completes)
export { InvoiceQueryService } from "./application/services/invoice.query-service";
// Domain
export {
	Invoice,
	type InvoiceItem,
	type InvoiceStatus,
} from "./domain/invoice.entity";
export type {
	IInvoiceRepository,
	InvoiceListFilters,
	InvoiceListResult,
} from "./domain/invoice.repository.interface";
// Infrastructure
export { InvoiceRepository } from "./infrastructure/invoice.repository";
