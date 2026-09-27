import type { Document, DocumentStatus } from "../entities/Document";
export interface DocumentQueryFilters {
    clientId?: string;
    status?: DocumentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    confidenceLevel?: "HIGH" | "MEDIUM" | "LOW";
}
export interface DocumentTenantScope {
    companyId: string;
}
export type DocumentFilters = DocumentQueryFilters & DocumentTenantScope;
export interface DocumentRepository {
    save(document: Document): Promise<void>;
    saveForCompany(document: Document, companyId: string): Promise<void>;
    update(document: Document): Promise<void>;
    updateForCompany(document: Document, companyId: string): Promise<void>;
    findById(id: string): Promise<Document | null>;
    findByIdForCompany(id: string, companyId: string): Promise<Document | null>;
    findAll(filters: DocumentFilters): Promise<Document[]>;
    count(filters: DocumentFilters): Promise<number>;
}
//# sourceMappingURL=document.repository.d.ts.map