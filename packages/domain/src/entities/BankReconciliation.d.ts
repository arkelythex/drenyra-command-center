export type ReconciliationStatus = "DRAFT" | "COMPLETED" | "CANCELLED";
export interface BankReconciliationProps {
    id: number;
    bankAccountId: number;
    organizationId: number;
    periodStart: Date;
    periodEnd: Date;
    openingBalance: number;
    closingBalanceStatement: number;
    closingBalanceBooks: number;
    difference: number;
    status: ReconciliationStatus;
    reconciledTransactionIds: number[];
    reconciledByUserId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class BankReconciliation {
    private readonly props;
    private constructor();
    static create(props: BankReconciliationProps): BankReconciliation;
    static createNew(params: {
        bankAccountId: number;
        organizationId: number;
        periodStart: Date;
        periodEnd: Date;
        openingBalance: number;
        closingBalanceStatement: number;
    }): BankReconciliation;
    private validateBusinessRules;
    addTransaction(transactionId: number): BankReconciliation;
    removeTransaction(transactionId: number): BankReconciliation;
    updateBooksBalance(closingBalanceBooks: number): BankReconciliation;
    complete(userId: string): BankReconciliation;
    cancel(): BankReconciliation;
    addNotes(notes: string): BankReconciliation;
    isBalanced(): boolean;
    get id(): number;
    get bankAccountId(): number;
    get organizationId(): number;
    get periodStart(): Date;
    get periodEnd(): Date;
    get openingBalance(): number;
    get closingBalanceStatement(): number;
    get closingBalanceBooks(): number;
    get difference(): number;
    get status(): ReconciliationStatus;
    get reconciledTransactionIds(): number[];
    get reconciledByUserId(): string | undefined;
    get notes(): string | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    get completedAt(): Date | undefined;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=BankReconciliation.d.ts.map