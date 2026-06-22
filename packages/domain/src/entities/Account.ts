/**
 * Account (Cuenta Contable) Entity.
 *
 * Represents a specific account within the Chart of Accounts, strictly
 * following the Peruvian PCGE (Plan Contable General Empresarial) standards.
 *
 * Split from 565 lines → types extracted to account.types.ts.
 */

import type { Money } from "../value-objects/Money";
import type {
	AccountLevel,
	AccountProps,
	ChartAccountType,
	Currency,
} from "./account.types";
import {
	ACCOUNT_LEVEL_NAMES,
	getExpectedCodeLength,
	validateTypeMatchesCode,
} from "./account.types";

export type {
	AccountLevel,
	AccountProps,
	AccountType,
	ChartAccountType,
	Currency,
} from "./account.types";
export { ACCOUNT_LEVEL_NAMES, ACCOUNT_TYPE_CLASSES } from "./account.types";

/**
 * Account aggregate root for the Chart of Accounts (PCGE).
 */
export class Account {
	private constructor(private props: AccountProps) {
		this.validateBusinessRules();
		Object.freeze(this);
	}

	static create(props: AccountProps): Account {
		return new Account(props);
	}

	private validateBusinessRules(): void {
		if (!this.props.code || this.props.code.trim().length === 0)
			throw new Error("El código de cuenta es requerido");
		if (!/^\d+$/.test(this.props.code))
			throw new Error("El código de cuenta debe ser numérico");

		const expectedLength = getExpectedCodeLength(this.props.level);
		if (this.props.code.length !== expectedLength)
			throw new Error(
				`El código de nivel ${ACCOUNT_LEVEL_NAMES[this.props.level]} debe tener ${expectedLength} dígitos`,
			);

		if (!this.props.name || this.props.name.trim().length === 0)
			throw new Error("El nombre de cuenta es requerido");
		validateTypeMatchesCode(this.props.type, this.props.code);

		if (this.props.balance.getCurrency() !== "PEN")
			throw new Error("El balance principal debe estar en PEN");
		if (this.props.balanceUSD && this.props.balanceUSD.getCurrency() !== "USD")
			throw new Error("El balance USD debe estar en dólares");
	}

	canBeDeleted(): boolean {
		return !this.props.isSystem;
	}
	canModifyCoreFields(): boolean {
		return !this.props.isSystem;
	}
	canHaveChildren(): boolean {
		return this.props.isGroup;
	}
	canHaveTransactions(): boolean {
		return !this.props.isGroup;
	}
	isMovementAccount(): boolean {
		return !this.props.isGroup;
	}
	isDebitNature(): boolean {
		return ["Activo", "Gasto", "Costo"].includes(this.props.type);
	}
	isCreditNature(): boolean {
		return ["Pasivo", "Patrimonio", "Ingreso"].includes(this.props.type);
	}

	deactivate(): Account {
		if (!this.props.isActive) throw new Error("La cuenta ya está inactiva");
		return new Account({
			...this.props,
			isActive: false,
			updatedAt: new Date(),
		});
	}

	activate(): Account {
		if (this.props.isActive) throw new Error("La cuenta ya está activa");
		return new Account({
			...this.props,
			isActive: true,
			updatedAt: new Date(),
		});
	}

	toggleStatus(): Account {
		return new Account({
			...this.props,
			isActive: !this.props.isActive,
			updatedAt: new Date(),
		});
	}

	update(data: {
		name?: string;
		description?: string;
		destination?: string;
		isActive?: boolean;
		code?: string;
		type?: ChartAccountType;
		level?: AccountLevel;
		isGroup?: boolean;
		currency?: Currency;
		parentId?: string;
	}): Account {
		if (this.props.isSystem) {
			const restrictedFields = [
				"code",
				"type",
				"level",
				"isGroup",
				"currency",
				"parentId",
			] as const;
			const attemptedRestricted = restrictedFields.filter(
				(field) =>
					data[field] !== undefined && data[field] !== this.props[field],
			);
			if (attemptedRestricted.length > 0)
				throw new Error(
					`No se pueden modificar los campos ${attemptedRestricted.join(", ")} de una cuenta del sistema`,
				);
		}

		return new Account({
			...this.props,
			code: this.props.isSystem
				? this.props.code
				: (data.code ?? this.props.code),
			name: data.name ?? this.props.name,
			description: data.description ?? this.props.description,
			level: this.props.isSystem
				? this.props.level
				: (data.level ?? this.props.level),
			type: this.props.isSystem
				? this.props.type
				: (data.type ?? this.props.type),
			parentId: this.props.isSystem
				? this.props.parentId
				: "parentId" in data
					? data.parentId
					: this.props.parentId,
			isGroup: this.props.isSystem
				? this.props.isGroup
				: (data.isGroup ?? this.props.isGroup),
			isActive: data.isActive ?? this.props.isActive,
			currency: this.props.isSystem
				? this.props.currency
				: (data.currency ?? this.props.currency),
			destination: data.destination ?? this.props.destination,
			updatedAt: new Date(),
		});
	}

	updateBalance(newBalance: Money, newBalanceUSD?: Money): Account {
		if (newBalance.getCurrency() !== "PEN")
			throw new Error("El balance principal debe estar en PEN");
		if (newBalanceUSD && newBalanceUSD.getCurrency() !== "USD")
			throw new Error("El balance USD debe estar en dólares");
		return new Account({
			...this.props,
			balance: newBalance,
			balanceUSD: newBalanceUSD ?? this.props.balanceUSD,
			updatedAt: new Date(),
		});
	}

	equals(other: Account | null | undefined): boolean {
		return !!other && this.props.id === other.props.id;
	}
	isAncestorOf(childCode: string): boolean {
		return (
			childCode.startsWith(this.props.code) &&
			childCode.length > this.props.code.length
		);
	}
	getLevelName(): string {
		return ACCOUNT_LEVEL_NAMES[this.props.level];
	}

	get id(): string {
		return this.props.id;
	}
	get organizationId(): number {
		return this.props.organizationId;
	}
	get code(): string {
		return this.props.code;
	}
	get name(): string {
		return this.props.name;
	}
	get description(): string | undefined {
		return this.props.description;
	}
	get level(): AccountLevel {
		return this.props.level;
	}
	get type(): ChartAccountType {
		return this.props.type;
	}
	get parentId(): string | undefined {
		return this.props.parentId;
	}
	get isGroup(): boolean {
		return this.props.isGroup;
	}
	get isActive(): boolean {
		return this.props.isActive;
	}
	get isSystem(): boolean {
		return this.props.isSystem;
	}
	get currency(): Currency {
		return this.props.currency;
	}
	get destination(): string | undefined {
		return this.props.destination;
	}
	get balance(): Money {
		return this.props.balance;
	}
	get balanceUSD(): Money | undefined {
		return this.props.balanceUSD;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			organizationId: this.props.organizationId,
			code: this.props.code,
			name: this.props.name,
			description: this.props.description,
			level: this.props.level,
			type: this.props.type,
			parentId: this.props.parentId,
			isGroup: this.props.isGroup,
			isActive: this.props.isActive,
			isSystem: this.props.isSystem,
			currency: this.props.currency,
			destination: this.props.destination,
			balance: this.props.balance.getAmount(),
			balanceUSD: this.props.balanceUSD?.getAmount(),
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
