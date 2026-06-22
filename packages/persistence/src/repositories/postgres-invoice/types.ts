import type { InvoiceFilters } from "@arkelythex/domain/repositories/invoice.repository";
import { businessPartners, invoiceItems, invoices } from "../../schema";

export interface ModularInvoiceWithRelations {
	invoice: typeof invoices.$inferSelect;
	customer: typeof businessPartners.$inferSelect;
	items: Array<typeof invoiceItems.$inferSelect>;
}

export type NormalizedInvoiceFilters = Omit<InvoiceFilters, "startDate" | "endDate"> & {
	startDate?: Date;
	endDate?: Date;
};

export type ModularInvoiceReadStatus = "DRAFT" | "SENT" | "CANCELLED";
export type ModularSunatReadStatus = "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "ANNULLED" | null;
