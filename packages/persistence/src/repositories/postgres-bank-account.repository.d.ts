import { BankAccount, type Currency } from "@drenyra/domain/entities/BankAccount";
import type { BankAccountFilters, BankAccountRepository } from "@drenyra/domain/repositories/bank-account.repository";
export declare class PostgresBankAccountRepository implements BankAccountRepository {
    save(account: BankAccount): Promise<BankAccount>;
    update(account: BankAccount): Promise<BankAccount>;
    findById(id: number, organizationId: number): Promise<BankAccount | null>;
    findByAccountNumber(accountNumber: string, organizationId: number): Promise<BankAccount | null>;
    findAll(organizationId: number, filters?: BankAccountFilters): Promise<BankAccount[]>;
    findAllActive(organizationId: number): Promise<BankAccount[]>;
    findDetraccionesAccount(organizationId: number): Promise<BankAccount | null>;
    updateBalance(id: number, newBalance: number, _currency: Currency): Promise<void>;
    getTotalBalanceByCurrency(organizationId: number): Promise<Record<Currency, number>>;
    count(organizationId: number, filters?: BankAccountFilters): Promise<number>;
    delete(id: number, organizationId: number): Promise<void>;
    private buildConditions;
    private mapToDomain;
}
//# sourceMappingURL=postgres-bank-account.repository.d.ts.map