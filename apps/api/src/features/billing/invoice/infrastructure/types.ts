import type { invoiceItems, invoices } from "@arkelythex/persistence/schema";

export type InvoiceRow = typeof invoices.$inferSelect;
export type InvoiceItemRow = typeof invoiceItems.$inferSelect;
