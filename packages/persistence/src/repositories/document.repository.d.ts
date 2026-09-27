import type { Document } from "@drenyra/domain/entities/Document";
import type { DocumentFilters, DocumentRepository } from "@drenyra/domain/repositories/document.repository";
export declare class DocumentRepositoryImpl implements DocumentRepository {
    private readonly resolveLegacyOrganizationId;
    save(_document: Document): Promise<void>;
    saveForCompany(document: Document, companyId: string): Promise<void>;
    update(_document: Document): Promise<void>;
    updateForCompany(document: Document, companyId: string): Promise<void>;
    private persistDocument;
    findById(_id: string): Promise<Document | null>;
    findByIdForCompany(id: string, companyId: string): Promise<Document | null>;
    private findDocumentByIdForCompany;
    findAll(filters: DocumentFilters): Promise<Document[]>;
    count(filters: DocumentFilters): Promise<number>;
    private buildWhereConditions;
    private buildCompanyScopedConditions;
    private buildQueryConditions;
}
//# sourceMappingURL=document.repository.d.ts.map