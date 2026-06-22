/**
 * Account (Cuenta Contable) Types — PCGE types, constants, and props.
 */

export type AccountLevel = "1" | "2" | "3" | "4" | "5";

export type ChartAccountType =
	| "Activo"
	| "Pasivo"
	| "Patrimonio"
	| "Ingreso"
	| "Gasto"
	| "Saldo"
	| "Costo";

/** @deprecated Use ChartAccountType instead */
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

export const ACCOUNT_LEVEL_NAMES: Record<AccountLevel, string> = {
	"1": "Rubro",
	"2": "Cuenta",
	"3": "Sub-Cuenta",
	"4": "Divisionaria",
	"5": "Sub-Divisionaria",
};

export const ACCOUNT_TYPE_CLASSES: Record<ChartAccountType, string[]> = {
	Activo: ["1", "2", "3"],
	Pasivo: ["4"],
	Patrimonio: ["5"],
	Gasto: ["6"],
	Ingreso: ["7"],
	Saldo: ["8"],
	Costo: ["9"],
};

export const EXPECTED_CODE_LENGTH: Record<AccountLevel, number> = {
	"1": 2,
	"2": 3,
	"3": 4,
	"4": 5,
	"5": 6,
};

export function getExpectedCodeLength(level: AccountLevel): number {
	return EXPECTED_CODE_LENGTH[level] ?? 2;
}

export function validateTypeMatchesCode(
	type: ChartAccountType,
	code: string,
): void {
	const firstDigit = code.charAt(0);
	const allowedClasses = ACCOUNT_TYPE_CLASSES[type];
	if (!allowedClasses.includes(firstDigit)) {
		throw new Error(
			`El tipo "${type}" no es válido para códigos que empiezan con ${firstDigit}`,
		);
	}
}
