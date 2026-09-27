import type { FiscalMemoryCategory, FiscalMemoryScope, FiscalMemorySeverity } from "@drenyra/domain/fiscal-memory";
import { FiscalMemory, FiscalMemoryRevision } from "@drenyra/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@drenyra/domain/repositories/fiscal-memory.repository";
export declare class PostgresFiscalMemoryRepository implements FiscalMemoryRepository {
    save(memory: FiscalMemory): Promise<void>;
    findById(id: string, scope: FiscalMemoryScope): Promise<FiscalMemory | null>;
    findByPeriod(scope: FiscalMemoryScope, period: string): Promise<FiscalMemory[]>;
    findByCategory(scope: FiscalMemoryScope, category: FiscalMemoryCategory): Promise<FiscalMemory[]>;
    findBySeverity(scope: FiscalMemoryScope, severity: FiscalMemorySeverity): Promise<FiscalMemory[]>;
    findByEvidenceRef(scope: FiscalMemoryScope, evidenceRef: string): Promise<FiscalMemory[]>;
    findRelated(scope: FiscalMemoryScope, memoryId: string): Promise<FiscalMemory[]>;
    saveRevision(revision: FiscalMemoryRevision): Promise<void>;
    findRevisions(memoryId: string): Promise<FiscalMemoryRevision[]>;
    private findMany;
    private toDomain;
    private toRevisionDomain;
}
//# sourceMappingURL=postgres-fiscal-memory.repository.d.ts.map