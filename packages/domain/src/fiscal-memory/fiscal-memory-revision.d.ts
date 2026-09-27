import type { FiscalMemoryProps, FiscalMemoryRevisionProps } from "./fiscal-memory.types";
export declare class FiscalMemoryRevision {
    private readonly props;
    private constructor();
    static create(props: FiscalMemoryRevisionProps): FiscalMemoryRevision;
    get id(): string;
    get memoryId(): string;
    get revisionNumber(): number;
    get changedBy(): string;
    get changeReason(): string;
    get previousValue(): FiscalMemoryProps;
    get nextValue(): FiscalMemoryProps;
    get createdAt(): Date;
    toJSON(): FiscalMemoryRevisionProps;
}
//# sourceMappingURL=fiscal-memory-revision.d.ts.map