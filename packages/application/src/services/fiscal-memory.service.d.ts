import { FiscalMemory, type FiscalMemoryCategory, type FiscalMemoryScope, type FiscalMemorySeverity } from "@arkelythex/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@arkelythex/domain/repositories/fiscal-memory.repository";
export interface RecordFiscalMemoryInput extends FiscalMemoryScope {
    readonly id?: string;
    readonly period: string;
    readonly category: FiscalMemoryCategory;
    readonly severity: FiscalMemorySeverity;
    readonly title: string;
    readonly summary: string;
    readonly evidenceRefs?: readonly string[];
    readonly tags?: readonly string[];
    readonly createdBy: string;
    readonly approvedBy?: string;
    readonly sourceAgentId?: string;
    readonly relatedMemoryIds?: readonly string[];
}
export type RecordDecisionInput = Omit<RecordFiscalMemoryInput, "category"> & {
    readonly category?: "accounting_criterion" | "tax_decision" | "risk_exception";
};
export type RecordAuditFindingInput = Omit<RecordFiscalMemoryInput, "category">;
export type RecordMonthlyClosingInput = Omit<RecordFiscalMemoryInput, "category">;
export declare class FiscalMemoryService {
    private readonly repository;
    constructor(repository: FiscalMemoryRepository);
    recordDecision(input: RecordDecisionInput): Promise<FiscalMemory>;
    recordAuditFinding(input: RecordAuditFindingInput): Promise<FiscalMemory>;
    recordMonthlyClosingMemory(input: RecordMonthlyClosingInput): Promise<FiscalMemory>;
    resolveMemory(input: {
        readonly id: string;
        readonly scope: FiscalMemoryScope;
        readonly changedBy: string;
        readonly changeReason: string;
        readonly summary?: string;
    }): Promise<FiscalMemory>;
    supersedeMemory(input: {
        readonly id: string;
        readonly scope: FiscalMemoryScope;
        readonly changedBy: string;
        readonly changeReason: string;
        readonly summary?: string;
    }): Promise<FiscalMemory>;
    private recordMemory;
    private changeStatus;
    private createRevision;
}
//# sourceMappingURL=fiscal-memory.service.d.ts.map