import type { Invoice } from "../entities/Invoice";
export interface InvoiceFilters {
    status?: "DRAFT" | "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED";
    clientName?: string;
    clientRUC?: string;
    clientSearch?: string;
    series?: string;
    dateFrom?: Date;
    dateTo?: Date;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
    offset?: number;
}
export interface InvoiceRepository {
    save(invoice: Invoice): Promise<void>;
    saveForOrganization(invoice: Invoice, organizationId: number): Promise<void>;
    update(invoice: Invoice): Promise<void>;
    updateForOrganization(invoice: Invoice, organizationId: number): Promise<void>;
    delete(id: string): Promise<void>;
    findById(scope: import("../scope").TenantScope, id: string): Promise<Invoice | null>;
    findAll(filters?: InvoiceFilters): Promise<Invoice[]>;
    count(filters?: InvoiceFilters): Promise<number>;
}
//# sourceMappingURL=invoice.repository.d.ts.map