import type { Money } from "../../value-objects/Money";

export type BankAccountType =
	| "CORRIENTE"
	| "AHORROS"
	| "CTS"
	| "DETRACCIONES"
	| "OTRO";

export type Currency = import("../../types/currency").Currency;

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
	isActive: boolean;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}
