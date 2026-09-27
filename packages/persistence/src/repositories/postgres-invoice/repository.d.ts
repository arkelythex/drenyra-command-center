import { Invoice } from "@drenyra/domain/entities/Invoice";
import type { InvoiceFilters, InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresInvoiceRepository implements InvoiceRepository {
    save(_invoice: Invoice): Promise<void>;
    saveForOrganization(invoice: Invoice, organizationId: number): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<Invoice | null>;
    findAll(filters?: InvoiceFilters): Promise<Invoice[]>;
    delete(id: string): Promise<void>;
    update(_invoice: Invoice): Promise<void>;
    updateForOrganization(invoice: Invoice, organizationId: number): Promise<void>;
    count(filters?: InvoiceFilters): Promise<number>;
    private upsertToModularStore;
    private normalizeFilters;
    private findModularById;
    private findAllModular;
    private mapModularToDomain;
}
//# sourceMappingURL=repository.d.ts.map