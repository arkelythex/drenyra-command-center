/**
 * Account DTOs with Zod Validation
 *
 * Data Transfer Objects for Account operations
 * Following Clean Architecture principles
 */

import type { Currency } from "@arkelythex/domain/types/currency";
import { z } from "zod";

// Account Level Enum
/**
 * accountLevelSchema const.
 *
 * @example
 * ```ts
 * console.log(accountLevelSchema);
 * ```
 */
export const accountLevelSchema = z.enum(["1", "2", "3", "4", "5"]);
/**
 * AccountLevelDTO type.
 *
 * @example
 * ```ts
 * const value: AccountLevelDTO = {} as AccountLevelDTO;
 * console.log(value);
 * ```
 */
export type AccountLevelDTO = z.infer<typeof accountLevelSchema>;

// Account Type Enum
/**
 * accountTypeSchema const.
 *
 * @example
 * ```ts
 * console.log(accountTypeSchema);
 * ```
 */
export const accountTypeSchema = z.enum([
	"Activo",
	"Pasivo",
	"Patrimonio",
	"Ingreso",
	"Gasto",
	"Saldo",
	"Costo",
]);
/**
 * AccountTypeDTO type.
 *
 * @example
 * ```ts
 * const value: AccountTypeDTO = {} as AccountTypeDTO;
 * console.log(value);
 * ```
 */
export type AccountTypeDTO = z.infer<typeof accountTypeSchema>;

// Currency Enum
/**
 * currencySchema const.
 *
 * @example
 * ```ts
 * console.log(currencySchema);
 * ```
 */
export const currencySchema = z.enum(["PEN", "USD", "EUR"]);
/**
 * CurrencyDTO type.
 *
 * @example
 * ```ts
 * const value: CurrencyDTO = {} as CurrencyDTO;
 * console.log(value);
 * ```
 */
export type CurrencyDTO = z.infer<typeof currencySchema>;

/**
 * Schema for creating a new account
 * @example
 * ```ts
 * console.log(createAccountSchema);
 * ```
 */

export const createAccountSchema = z
	.object({
		organizationId: z
			.number()
			.int()
			.positive("Organization ID debe ser positivo"),
		code: z
			.string()
			.min(2, "El código debe tener al menos 2 dígitos")
			.max(6, "El código no puede tener más de 6 dígitos")
			.regex(/^\d+$/, "El código debe ser numérico"),
		name: z
			.string()
			.min(1, "El nombre es requerido")
			.max(200, "El nombre no puede exceder 200 caracteres"),
		description: z.string().max(500).optional(),
		level: accountLevelSchema,
		type: accountTypeSchema,
		parentId: z.string().uuid().optional(),
		isGroup: z.boolean().default(true),
		isSystem: z.boolean().default(false),
		currency: currencySchema.default("PEN"),
		destination: z.string().max(100).optional(),
	})
	.refine(
		(data) => {
			// Validate code length matches level
			const expectedLengths: Record<string, number> = {
				"1": 2,
				"2": 3,
				"3": 4,
				"4": 5,
				"5": 6,
			};
			return data.code.length === expectedLengths[data.level];
		},
		{
			message: "La longitud del código no coincide con el nivel seleccionado",
			path: ["code"],
		},
	)
	.refine(
		(data) => {
			// Validate type matches code's first digit
			const typeClasses: Record<string, string[]> = {
				Activo: ["1", "2", "3"],
				Pasivo: ["4"],
				Patrimonio: ["5"],
				Gasto: ["6"],
				Ingreso: ["7"],
				Saldo: ["8"],
				Costo: ["9"],
			};
			const firstDigit = data.code.charAt(0);
			return typeClasses[data.type]?.includes(firstDigit) ?? false;
		},
		{
			message: "El tipo de cuenta no es válido para el código ingresado",
			path: ["type"],
		},
	);

/**
 * CreateAccountDTO type.
 *
 * @example
 * ```ts
 * const value: CreateAccountDTO = {} as CreateAccountDTO;
 * console.log(value);
 * ```
 */
export type CreateAccountDTO = z.infer<typeof createAccountSchema>;

/**
 * Schema for updating an existing account
 * @example
 * ```ts
 * console.log(updateAccountSchema);
 * ```
 */

export const updateAccountSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().max(500).optional().nullable(),
	destination: z.string().max(100).optional().nullable(),
	isActive: z.boolean().optional(),
	// These fields can only be updated for non-system accounts
	code: z.string().regex(/^\d+$/).min(2).max(6).optional(),
	type: accountTypeSchema.optional(),
	level: accountLevelSchema.optional(),
	isGroup: z.boolean().optional(),
	currency: currencySchema.optional(),
	parentId: z.string().uuid().optional().nullable(),
});

/**
 * UpdateAccountDTO type.
 *
 * @example
 * ```ts
 * const value: UpdateAccountDTO = {} as UpdateAccountDTO;
 * console.log(value);
 * ```
 */
export type UpdateAccountDTO = z.infer<typeof updateAccountSchema>;

/**
 * Schema for account filters
 * @example
 * ```ts
 * console.log(accountFiltersSchema);
 * ```
 */

export const accountFiltersSchema = z.object({
	organizationId: z.number().int().positive(),
	searchTerm: z.string().optional(),
	type: accountTypeSchema.optional(),
	currency: currencySchema.optional(),
	level: accountLevelSchema.optional(),
	status: z.enum(["active", "inactive", "all"]).default("all"),
	onlyCustom: z.boolean().default(false),
	onlyMovement: z.boolean().default(false),
	parentId: z.string().uuid().optional(),
});

/**
 * AccountFiltersDTO type.
 *
 * @example
 * ```ts
 * const value: AccountFiltersDTO = {} as AccountFiltersDTO;
 * console.log(value);
 * ```
 */
export type AccountFiltersDTO = z.infer<typeof accountFiltersSchema>;

/**
 * Schema for updating account balance
 * @example
 * ```ts
 * console.log(updateBalanceSchema);
 * ```
 */

export const updateBalanceSchema = z.object({
	balance: z.number().min(0, "El balance no puede ser negativo"),
	balanceUSD: z.number().min(0).optional(),
});

/**
 * UpdateBalanceDTO type.
 *
 * @example
 * ```ts
 * const value: UpdateBalanceDTO = {} as UpdateBalanceDTO;
 * console.log(value);
 * ```
 */
export type UpdateBalanceDTO = z.infer<typeof updateBalanceSchema>;

/**
 * Response DTO for Account
 * @example
 * ```ts
 * const value: AccountResponseDTO = {} as AccountResponseDTO;
 * console.log(value);
 * ```
 */

export interface AccountResponseDTO {
	id: string;
	organizationId: number;
	code: string;
	name: string;
	description?: string;
	level: AccountLevelDTO;
	levelName: string;
	type: AccountTypeDTO;
	parentId?: string;
	isGroup: boolean;
	isActive: boolean;
	isSystem: boolean;
	currency: CurrencyDTO;
	destination?: string;
	balance: number;
	balanceUSD?: number;
	formattedBalance: string;
	formattedBalanceUSD?: string;
	canBeDeleted: boolean;
	canHaveChildren: boolean;
	canHaveTransactions: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Response DTO for hierarchical accounts
 * @example
 * ```ts
 * const value: AccountHierarchyDTO = {} as AccountHierarchyDTO;
 * console.log(value);
 * ```
 */

export interface AccountHierarchyDTO extends AccountResponseDTO {
	children: AccountHierarchyDTO[];
}

/**
 * Helper function to format balance for display
 * @param amount - Input for amount.
 * @param currency - Input for currency.
 * @returns Result of formatBalance.
 * @example
 * ```ts
 * const result = formatBalance(0, {} as CurrencyDTO);
 * console.log(result);
 * ```
 */

export function formatBalance(amount: number, currency: Currency): string {
	const symbol =
		currency === "PEN" ? "S/" : currency === "USD" ? "$" : "EUR ";
	return `${symbol} ${amount.toLocaleString("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

/**
 * Level name mapping
 * @example
 * ```ts
 * console.log(LEVEL_NAMES);
 * ```
 */

export const LEVEL_NAMES: Record<AccountLevelDTO, string> = {
	"1": "Rubro",
	"2": "Cuenta",
	"3": "Sub-Cuenta",
	"4": "Divisionaria",
	"5": "Sub-Divisionaria",
};
