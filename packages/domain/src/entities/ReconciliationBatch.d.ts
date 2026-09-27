import { Money } from "../value-objects/Money";
export type ReconciliationBatchStatus = "OPEN" | "IN_PROGRESS" | "PARTIALLY_MATCHED" | "MATCHED" | "CLOSED_WITH_DISCREPANCY" | "CLOSED";
export type ReconciliationMode = "MANUAL" | "AUTO";
export interface ReconciliationBatchProps {
    id: string;
    companyId: string;
    bankAccountId: string;
    periodStart: Date;
    periodEnd: Date;
    status: ReconciliationBatchStatus;
    openingBalance: Money;
    closingBalance: Money | null;
    matchedCount: number;
    unmatchedCount: number;
    discrepancyAmount: Money | null;
    mode: ReconciliationMode;
    createdAt: Date;
    closedAt: Date | null;
}
export declare class ReconciliationBatch {
    private readonly props;
    private constructor();
    static createNew(params: {
        companyId: string;
        bankAccountId: string;
        periodStart: Date;
        periodEnd: Date;
        openingBalance: Money;
        mode?: ReconciliationMode;
    }): ReconciliationBatch;
    static create(props: ReconciliationBatchProps): ReconciliationBatch;
    private validateInvariants;
    private assertOpen;
    private assertNotOpen;
    private computeStatus;
    startProcessing(): ReconciliationBatch;
    addMatch(count: number): ReconciliationBatch;
    addUnmatched(count: number): ReconciliationBatch;
    close(closingBalance: Money): ReconciliationBatch;
    calculateDiscrepancy(closingBalance: Money, totalCredits: Money, totalDebits: Money): Money;
    private calculateDiscrepancyInternal;
    get id(): string;
    get companyId(): string;
    get bankAccountId(): string;
    get periodStart(): Date;
    get periodEnd(): Date;
    get status(): ReconciliationBatchStatus;
    get openingBalance(): Money;
    get closingBalance(): Money | null;
    get matchedCount(): number;
    get unmatchedCount(): number;
    get discrepancyAmount(): Money | null;
    get mode(): ReconciliationMode;
    get createdAt(): Date;
    get closedAt(): Date | null;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=ReconciliationBatch.d.ts.map