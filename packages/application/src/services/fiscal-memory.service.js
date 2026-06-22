import { FiscalMemory, FiscalMemoryRevision, } from "@arkelythex/domain/fiscal-memory";
const createFiscalMemoryId = () => `fiscal-memory-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export class FiscalMemoryService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async recordDecision(input) {
        return this.recordMemory({
            ...input,
            category: input.category ?? "tax_decision",
        });
    }
    async recordAuditFinding(input) {
        return this.recordMemory({
            ...input,
            category: "audit_finding",
        });
    }
    async recordMonthlyClosingMemory(input) {
        return this.recordMemory({
            ...input,
            category: "monthly_closing",
        });
    }
    async resolveMemory(input) {
        return this.changeStatus({ ...input, status: "resolved" });
    }
    async supersedeMemory(input) {
        return this.changeStatus({ ...input, status: "superseded" });
    }
    async recordMemory(input) {
        const now = new Date();
        const memory = FiscalMemory.create({
            id: input.id ?? createFiscalMemoryId(),
            tenantId: input.tenantId,
            companyId: input.companyId,
            ruc: input.ruc,
            period: input.period,
            category: input.category,
            severity: input.severity,
            title: input.title,
            summary: input.summary,
            evidenceRefs: input.evidenceRefs ?? [],
            tags: input.tags ?? [],
            createdBy: input.createdBy,
            approvedBy: input.approvedBy,
            sourceAgentId: input.sourceAgentId,
            relatedMemoryIds: input.relatedMemoryIds ?? [],
            createdAt: now,
            updatedAt: now,
        });
        await this.repository.save(memory);
        return memory;
    }
    async changeStatus(input) {
        const current = await this.repository.findById(input.id, input.scope);
        if (!current) {
            throw new Error(`Fiscal memory not found: ${input.id}`);
        }
        const updatedStatus = current.withStatus(input.status);
        const updated = input.summary
            ? updatedStatus.withSummary(input.summary)
            : updatedStatus;
        const revision = await this.createRevision({
            previousValue: current.toJSON(),
            nextValue: updated.toJSON(),
            changedBy: input.changedBy,
            changeReason: input.changeReason,
        });
        await this.repository.save(updated);
        await this.repository.saveRevision(revision);
        return updated;
    }
    async createRevision(input) {
        const revisions = await this.repository.findRevisions(input.previousValue.id);
        return FiscalMemoryRevision.create({
            id: createFiscalMemoryId(),
            memoryId: input.previousValue.id,
            revisionNumber: revisions.length + 1,
            changedBy: input.changedBy,
            changeReason: input.changeReason,
            previousValue: input.previousValue,
            nextValue: input.nextValue,
            createdAt: new Date(),
        });
    }
}
//# sourceMappingURL=fiscal-memory.service.js.map