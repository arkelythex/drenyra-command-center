import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
export interface EvidenceTimelineEntry {
    action: string;
    previousStatus: string;
    newStatus: string;
    actor: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export declare class GetEvidenceTimelineHandler {
    private readonly evidenceRepository;
    constructor(evidenceRepository: EvidenceRepository);
    execute(query: {
        id: string;
        organizationId: number;
    }): Promise<EvidenceTimelineEntry[]>;
}
//# sourceMappingURL=get-timeline.handler.d.ts.map