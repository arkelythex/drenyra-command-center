import type { FiscalMemory } from "../fiscal-memory/fiscal-memory";
import type { FiscalMemoryCategory, FiscalMemoryScope, FiscalMemorySeverity } from "../fiscal-memory/fiscal-memory.types";
import type { FiscalMemoryRevision } from "../fiscal-memory/fiscal-memory-revision";
export interface FiscalMemoryRepository {
    save(memory: FiscalMemory): Promise<void>;
    findById(id: string, scope: FiscalMemoryScope): Promise<FiscalMemory | null>;
    findByPeriod(scope: FiscalMemoryScope, period: string): Promise<FiscalMemory[]>;
    findByCategory(scope: FiscalMemoryScope, category: FiscalMemoryCategory): Promise<FiscalMemory[]>;
    findBySeverity(scope: FiscalMemoryScope, severity: FiscalMemorySeverity): Promise<FiscalMemory[]>;
    findByEvidenceRef(scope: FiscalMemoryScope, evidenceRef: string): Promise<FiscalMemory[]>;
    findRelated(scope: FiscalMemoryScope, memoryId: string): Promise<FiscalMemory[]>;
    saveRevision(revision: FiscalMemoryRevision): Promise<void>;
    findRevisions(memoryId: string): Promise<FiscalMemoryRevision[]>;
}
//# sourceMappingURL=fiscal-memory.repository.d.ts.map