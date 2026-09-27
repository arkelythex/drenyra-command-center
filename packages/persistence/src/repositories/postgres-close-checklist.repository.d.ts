import type { CloseChecklistItemRecord, CloseChecklistRecord, CloseChecklistRepository, CloseChecklistWithItems, CloseDashboard, CloseGateRecord } from "@drenyra/domain/repositories/close-checklist.repository";
export declare class PostgresCloseChecklistRepository implements CloseChecklistRepository {
    save(data: Omit<CloseChecklistRecord, "id" | "createdAt" | "updatedAt" | "progress">): Promise<CloseChecklistRecord>;
    findById(id: string): Promise<CloseChecklistWithItems | null>;
    findByCompanyAndPeriod(companyId: string, period: string): Promise<CloseChecklistRecord[]>;
    findAllByCompany(companyId: string): Promise<CloseChecklistRecord[]>;
    updateStatus(id: string, status: CloseChecklistRecord["status"]): Promise<CloseChecklistRecord | null>;
    updateProgress(id: string): Promise<number>;
    delete(id: string): Promise<void>;
    count(companyId: string): Promise<number>;
    saveItem(data: Omit<CloseChecklistItemRecord, "id" | "createdAt" | "updatedAt">): Promise<CloseChecklistItemRecord>;
    updateItem(id: string, data: Partial<Pick<CloseChecklistItemRecord, "status" | "completedAt" | "completedById" | "notes" | "evidenceIds">>): Promise<CloseChecklistItemRecord | null>;
    getItemsByChecklistId(checklistId: string): Promise<CloseChecklistItemRecord[]>;
    saveGate(data: Omit<CloseGateRecord, "id" | "createdAt" | "updatedAt">): Promise<CloseGateRecord>;
    findGatesByCompanyAndPeriod(companyId: string, period: string): Promise<CloseGateRecord[]>;
    overrideGate(id: string, status: CloseGateRecord["status"], resolution: string, overrideById: string): Promise<CloseGateRecord | null>;
    getDashboard(companyId: string, period: string): Promise<CloseDashboard>;
}
//# sourceMappingURL=postgres-close-checklist.repository.d.ts.map