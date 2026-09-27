import { Money } from "../value-objects/Money";
export type BankAccountType = "CORRIENTE" | "AHORROS" | "CTS" | "DETRACCIONES" | "OTRO";
export type Currency = import("../types/currency").Currency;
export interface BankAccountProps {
    id: number;
    organizationId: number;
    bankName: string;
    accountNumber: string;
    accountType: BankAccountType;
    currency: Currency;
    accountingAccountId?: string;
    initialBalance: Money;
    currentBalance: Money;
    cci?: string;
    swiftCode?: string;
    providerId?: string | null;
    lastSyncAt?: Date | null;
    isActive: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class BankAccount {
    private readonly props;
    private constructor();
    static create(props: BankAccountProps): BankAccount;
    static createNew(params: {
        organizationId: number;
        bankName: string;
        accountNumber: string;
        accountType: BankAccountType;
        currency: Currency;
        initialBalance?: number;
        accountingAccountId?: string;
        cci?: string;
        swiftCode?: string;
        notes?: string;
    }): BankAccount;
    private validateBusinessRules;
    deposit(amount: Money, _description?: string): BankAccount;
    withdraw(amount: Money, _description?: string): BankAccount;
    deactivate(): BankAccount;
    reactivate(): BankAccount;
    update(params: {
        bankName?: string;
        accountType?: BankAccountType;
        accountingAccountId?: string | null;
        cci?: string;
        swiftCode?: string;
        notes?: string;
    }): BankAccount;
    isDetracciones(): boolean;
    linkProvider(providerId: string): BankAccount;
    markSynced(): BankAccount;
    getAvailableBalance(): Money;
    equals(other: BankAccount | null | undefined): boolean;
    get id(): number;
    get organizationId(): number;
    get bankName(): string;
    get accountNumber(): string;
    get accountType(): BankAccountType;
    get currency(): Currency;
    get accountingAccountId(): string | undefined;
    get initialBalance(): Money;
    get currentBalance(): Money;
    get cci(): string | undefined;
    get swiftCode(): string | undefined;
    get isActive(): boolean;
    get providerId(): string | null;
    get lastSyncAt(): Date | null;
    get notes(): string | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=BankAccount.d.ts.map