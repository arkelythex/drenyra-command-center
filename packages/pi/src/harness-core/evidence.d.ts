import type { EvidenceQuery, EvidenceRecord } from "./types.js";
export interface EvidenceStore {
    save(record: EvidenceRecord): Promise<void>;
    query(query: EvidenceQuery): Promise<EvidenceRecord[]>;
    getById(id: string): Promise<EvidenceRecord | null>;
    deleteByRun(runId: string): Promise<void>;
}
export interface InMemoryEvidenceStoreOptions {
    maxRecords?: number;
}
export declare class InMemoryEvidenceStore implements EvidenceStore {
    private readonly records;
    private readonly maxRecords;
    constructor(options?: InMemoryEvidenceStoreOptions);
    save(record: EvidenceRecord): Promise<void>;
    query(query: EvidenceQuery): Promise<EvidenceRecord[]>;
    getById(id: string): Promise<EvidenceRecord | null>;
    deleteByRun(runId: string): Promise<void>;
    get count(): number;
}
//# sourceMappingURL=evidence.d.ts.map