import type { EvidenceType, FiscalScope } from "../../drenyra/types";
import type { EvidenceItemPrimitiveData, EvidenceItemProps } from "./types";
export declare class EvidenceItem {
    private props;
    private constructor();
    static create(props: EvidenceItemProps): EvidenceItem;
    static fromPrimitives(data: EvidenceItemPrimitiveData): EvidenceItem;
    updateSummary(summary: string): EvidenceItem;
    equals(other: EvidenceItem | null | undefined): boolean;
    get id(): string;
    get caseId(): string;
    get scope(): FiscalScope;
    get type(): EvidenceType;
    get title(): string;
    get summary(): string;
    get source(): string;
    get sourceRef(): string | undefined;
    get contentHash(): string;
    get addedBy(): string;
    get createdAt(): Date;
    get metadata(): Record<string, unknown>;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=evidence-item.entity.d.ts.map