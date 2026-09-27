import type { EvidenceLinkEntityType, EvidenceLinkRelationship } from "./evidence-link-type";
export interface EvidenceLinkProps {
    id: string;
    evidenceId: string;
    entityType: EvidenceLinkEntityType;
    entityId: string;
    relationship: EvidenceLinkRelationship;
    linkedBy: string;
    linkedAt: Date;
    metadata?: Record<string, unknown>;
}
export declare class EvidenceLink {
    readonly id: string;
    readonly evidenceId: string;
    readonly entityType: EvidenceLinkEntityType;
    readonly entityId: string;
    readonly relationship: EvidenceLinkRelationship;
    readonly linkedBy: string;
    readonly linkedAt: Date;
    readonly metadata: Readonly<Record<string, unknown>>;
    private constructor();
    static create(props: EvidenceLinkProps): EvidenceLink;
    static reconstitute(data: EvidenceLinkProps): EvidenceLink;
}
//# sourceMappingURL=evidence-link.d.ts.map