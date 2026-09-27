import { BankReconciliation } from "@drenyra/domain/entities/BankReconciliation";
import type { BankReconciliationRepository, ReconciliationFilters } from "@drenyra/domain/repositories/bank-reconciliation.repository";
export declare class PostgresBankReconciliationRepository implements BankReconciliationRepository {
    save(reconciliation: BankReconciliation): Promise<BankReconciliation>;
    update(reconciliation: BankReconciliation): Promise<BankReconciliation>;
    findById(id: number, organizationId: number): Promise<BankReconciliation | null>;
    findAll(organizationId: number, filters?: ReconciliationFilters): Promise<BankReconciliation[]>;
    findLatestByBankAccount(bankAccountId: number): Promise<BankReconciliation | null>;
    findPending(organizationId: number): Promise<BankReconciliation[]>;
    count(organizationId: number, filters?: ReconciliationFilters): Promise<number>;
    delete(id: number, organizationId: number): Promise<void>;
    private buildConditions;
    private mapToDomain;
}
//# sourceMappingURL=postgres-bank-reconciliation.repository.d.ts.map