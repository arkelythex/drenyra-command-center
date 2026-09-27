import type { EvidencePrimitiveData, EvidenceProps, EvidenceSource, EvidenceStatus, EvidenceType, HashChainEntry } from "./types";
export declare class Evidence {
    private props;
    private constructor();
    static create(props: EvidenceProps): Evidence;
    static fromPrimitives(data: EvidencePrimitiveData): Evidence;
    markAsExtracting(): Evidence;
    markAsClassified(evidenceType: EvidenceType): Evidence;
    markAsValidated(validatedBy: string): Evidence;
    markAsRejected(reason: string): Evidence;
    markAsError(message: string): Evidence;
    updateHashChain(prevHash: string | null): Promise<Evidence>;
    equals(other: Evidence | null | undefined): boolean;
    get id(): string;
    get organizationId(): string;
    get companyId(): string | undefined;
    get filename(): string;
    get mimeType(): string;
    get sizeBytes(): number;
    get hash(): string;
    get hashChain(): HashChainEntry | undefined;
    get evidenceType(): EvidenceType;
    get source(): EvidenceSource;
    get status(): EvidenceStatus;
    get metadata(): Record<string, unknown> | undefined;
    get extractedData(): Record<string, unknown> | undefined;
    get classifierResult(): Record<string, unknown> | undefined;
    get validatedAt(): Date | undefined;
    get validatedBy(): string | undefined;
    get errorMessage(): string | undefined;
    get tags(): readonly string[] | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=evidence.entity.d.ts.map