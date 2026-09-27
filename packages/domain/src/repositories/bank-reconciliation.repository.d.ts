import type { BankReconciliation, ReconciliationStatus } from "../entities/BankReconciliation";
export interface ReconciliationFilters {
    bankAccountId?: number;
    status?: ReconciliationStatus;
    periodFrom?: Date;
    periodTo?: Date;
}
export interface BankReconciliationRepository {
    save(reconciliation: BankReconciliation): Promise<BankReconciliation>;
    update(reconciliation: BankReconciliation): Promise<BankReconciliation>;
    findById(id: number, organizationId: number): Promise<BankReconciliation | null>;
    findAll(organizationId: number, filters?: ReconciliationFilters): Promise<BankReconciliation[]>;
    findLatestByBankAccount(bankAccountId: number): Promise<BankReconciliation | null>;
    findPending(organizationId: number): Promise<BankReconciliation[]>;
    count(organizationId: number, filters?: ReconciliationFilters): Promise<number>;
    delete(id: number, organizationId: number): Promise<void>;
}
//# sourceMappingURL=bank-reconciliation.repository.d.ts.map