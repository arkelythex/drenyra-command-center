/**
 * Account Type Value Object
 *
 * Represents the category of a bank account in the banking system.
 * This is the SINGLE SOURCE OF TRUTH for account types across the entire codebase.
 *
 * **Usage:**
 * ```typescript
 * import { AccountType } from '@drenyra/domain/value-objects/AccountType';
 *
 * const type: AccountType = 'CHECKING';
 * ```
 *
 * **Migration Note:**
 * This consolidates 4 previous definitions:
 * - packages/domain/src/entities/Account.ts (DEPRECATED)
 * - apps/api/src/types/banking.types.ts (DEPRECATED)
 * - apps/api/src/features/banking/domain/types.ts (DEPRECATED)
 * - packages/application/src/dtos/account/account.dto.ts (DEPRECATED)
 *
 * All imports should now reference this file.
 *
 * @module domain/value-objects/AccountType
 * @since 2026-02-10 (Phase 2 Type Consolidation)
 * Bank account category types supported by ARKELYTHEX.
 *
 * @typedef {('CHECKING' | 'SAVINGS' | 'CREDIT')} AccountType
 *
 * @property CHECKING - Cuenta corriente (most common for businesses)
 * @property SAVINGS - Cuenta de ahorros (for reserves/savings)
 * @property CREDIT - Línea de crédito (credit line)
 *
 * @example
 * ```typescript
 * const businessAccount: AccountType = 'CHECKING';
 * const reserveAccount: AccountType = 'SAVINGS';
 * const creditLine: AccountType = 'CREDIT';
 * ```
 */

export type BankAccountType = "CHECKING" | "SAVINGS" | "CREDIT";

/**
 * @deprecated Use BankAccountType instead. Kept for backwards compatibility.
 * @example
 * ```ts
 * const value: AccountType = {} as AccountType;
 * console.log(value);
 * ```
 */

export type AccountType = BankAccountType;

/**
 * Array of all valid account types.
 * Useful for validation, dropdowns, and iteration.
 *
 * @constant
 * @example
 * ```typescript
 * // Validate user input
 * if (!ACCOUNT_TYPES.includes(userInput)) {
 *   throw new Error('Invalid account type');
 * }
 *
 * // Generate dropdown options
 * const options = ACCOUNT_TYPES.map(type => ({ value: type, label: type }));
 * ```
 */
export const BANK_ACCOUNT_TYPES: readonly BankAccountType[] = [
	"CHECKING",
	"SAVINGS",
	"CREDIT",
] as const;

/**
 * @deprecated Use BANK_ACCOUNT_TYPES instead.
 * @example
 * ```ts
 * console.log(ACCOUNT_TYPES);
 * ```
 */

export const ACCOUNT_TYPES = BANK_ACCOUNT_TYPES;

/**
 * Human-readable labels for account types (Spanish).
 * Used for UI display in ARKELYTHEX dashboard.
 *
 * @constant
 * @example
 * ```typescript
 * const label = ACCOUNT_TYPE_LABELS['CHECKING']; // "Cuenta Corriente"
 * ```
 */
export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
	CHECKING: "Cuenta Corriente",
	SAVINGS: "Cuenta de Ahorros",
	CREDIT: "Línea de Crédito",
} as const;

/**
 * Type guard to check if a value is a valid AccountType.
 *
 * @param value - The value to check
 * @returns True if value is a valid AccountType
 *
 * @example
 * ```typescript
 * const userInput = 'CHECKING';
 * if (isAccountType(userInput)) {
 *   // TypeScript knows userInput is AccountType here
 *   const account = createAccount({ type: userInput });
 * }
 * ```
 */
export function isBankAccountType(value: unknown): value is BankAccountType {
	return (
		typeof value === "string" &&
		BANK_ACCOUNT_TYPES.includes(value as BankAccountType)
	);
}

/**
 * Validates and returns an AccountType, throwing if invalid.
 *
 * @param value - The value to validate
 * @returns The validated AccountType
 * @throws {Error} If value is not a valid AccountType
 *
 * @example
 * ```typescript
 * const type = assertAccountType('CHECKING'); // ✅ Returns 'CHECKING'
 * const invalid = assertAccountType('INVALID'); // ❌ Throws Error
 * ```
 */
export function assertBankAccountType(value: unknown): BankAccountType {
	if (!isBankAccountType(value)) {
		throw new Error(
			`Invalid BankAccountType: "${value}". Must be one of: ${BANK_ACCOUNT_TYPES.join(", ")}`,
		);
	}
	return value;
}
