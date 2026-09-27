import { type FiscalMemoryCategory, type FiscalMemoryProps, type FiscalMemorySeverity, type FiscalMemoryStatus } from "./fiscal-memory.types";
export declare class InvalidFiscalMemoryError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare class FiscalMemory {
    private readonly props;
    private constructor();
    static create(input: Omit<FiscalMemoryProps, "status" | "createdAt" | "updatedAt"> & Partial<Pick<FiscalMemoryProps, "status" | "createdAt" | "updatedAt">>): FiscalMemory;
    static rehydrate(props: FiscalMemoryProps): FiscalMemory;
    private static validate;
    withStatus(status: FiscalMemoryStatus, updatedAt?: Date): FiscalMemory;
    withSummary(summary: string, updatedAt?: Date): FiscalMemory;
    get id(): string;
    get tenantId(): string;
    get companyId(): string;
    get ruc(): string;
    get period(): string;
    get category(): FiscalMemoryCategory;
    get severity(): FiscalMemorySeverity;
    get status(): FiscalMemoryStatus;
    get title(): string;
    get summary(): string;
    get evidenceRefs(): readonly string[];
    get tags(): readonly string[];
    get createdBy(): string;
    get approvedBy(): string | undefined;
    get sourceAgentId(): string | undefined;
    get relatedMemoryIds(): readonly string[];
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): FiscalMemoryProps;
}
//# sourceMappingURL=fiscal-memory.d.ts.map