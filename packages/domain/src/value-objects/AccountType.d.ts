export type BankAccountType = "CHECKING" | "SAVINGS" | "CREDIT";
export type AccountType = BankAccountType;
export declare const BANK_ACCOUNT_TYPES: readonly BankAccountType[];
export declare const ACCOUNT_TYPES: readonly BankAccountType[];
export declare const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string>;
export declare function isBankAccountType(value: unknown): value is BankAccountType;
export declare function assertBankAccountType(value: unknown): BankAccountType;
//# sourceMappingURL=AccountType.d.ts.map