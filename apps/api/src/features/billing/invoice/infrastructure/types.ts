import type { invoiceItems, invoices } from "@drenyra/persistence/schema";

export type InvoiceRow = typeof invoices.$inferSelect;
export type InvoiceItemRow = typeof invoiceItems.$inferSelect;
