// Public API for Invoices Feature
// This is the ONLY entry point for other parts of the application.

// API Client (Typed via Eden Treaty)
export { invoicingApi } from "./api/invoicing.api";
export { invoiceKeys } from "./api/query-keys";
export { CreateInvoiceDialog } from "./components/create-invoice/CreateInvoiceDialog";
// UI Components
export { InvoicesBoard } from "./components/InvoicesBoard";
// Types
export type { Invoice } from "./hooks/useInvoices";
// Shared Hooks
export { useInvoices } from "./hooks/useInvoices";
export type { InvoiceFilters } from "./types/invoice-filters";
