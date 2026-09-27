import type { BankAccount, BankAccountType, Currency } from "../entities/BankAccount";
export interface BankAccountFilters {
    bankName?: string;
    accountType?: BankAccountType;
    currency?: Currency;
    isActive?: boolean;
    hasAccountingLink?: boolean;
}
export interface BankAccountRepository {
    save(account: BankAccount): Promise<BankAccount>;
    update(account: BankAccount): Promise<BankAccount>;
    findById(id: number, organizationId: number): Promise<BankAccount | null>;
    findByAccountNumber(accountNumber: string, organizationId: number): Promise<BankAccount | null>;
    findAll(organizationId: number, filters?: BankAccountFilters): Promise<BankAccount[]>;
    findAllActive(organizationId: number): Promise<BankAccount[]>;
    findDetraccionesAccount(organizationId: number): Promise<BankAccount | null>;
    updateBalance(id: number, newBalance: number, currency: Currency): Promise<void>;
    getTotalBalanceByCurrency(organizationId: number): Promise<Record<Currency, number>>;
    count(organizationId: number, filters?: BankAccountFilters): Promise<number>;
    delete(id: number, organizationId: number): Promise<void>;
}
//# sourceMappingURL=bank-account.repository.d.ts.map