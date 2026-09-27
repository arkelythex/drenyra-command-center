export type AccountLevel = "1" | "2" | "3" | "4" | "5";
export type ChartAccountType = "Activo" | "Pasivo" | "Patrimonio" | "Ingreso" | "Gasto" | "Saldo" | "Costo";
export type AccountType = ChartAccountType;
export type Currency = import("../types/currency").Currency;
import type { Money } from "../value-objects/Money";
export interface AccountProps {
    id: string;
    organizationId: number;
    code: string;
    name: string;
    description?: string;
    level: AccountLevel;
    type: ChartAccountType;
    parentId?: string;
    isGroup: boolean;
    isActive: boolean;
    isSystem: boolean;
    currency: Currency;
    destination?: string;
    balance: Money;
    balanceUSD?: Money;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ACCOUNT_LEVEL_NAMES: Record<AccountLevel, string>;
export declare const ACCOUNT_TYPE_CLASSES: Record<ChartAccountType, string[]>;
export declare const EXPECTED_CODE_LENGTH: Record<AccountLevel, number>;
export declare function getExpectedCodeLength(level: AccountLevel): number;
export declare function validateTypeMatchesCode(type: ChartAccountType, code: string): void;
//# sourceMappingURL=account.types.d.ts.map