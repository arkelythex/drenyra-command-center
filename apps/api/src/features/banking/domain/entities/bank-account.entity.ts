/**
 * Bank Account Entity
 * Rich domain model for bank account management
 *
 * @example
 * ```ts
 * const account = BankAccount.create({
 *   id: 'acc_123',
 *   companyId: 'cmp_123',
 *   accountName: 'Cuenta principal',
 *   accountNumber: '191-1234567890',
 *   accountType: 'CHECKING',
 *   bankName: 'BCP',
 *   currency: 'PEN',
 *   currentBalance: '0.00',
 *   isActive: true,
 *   isDefault: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * } as BankAccountProps);
 * ```
 */

import { type Currency, Money } from "@drenyra/domain/value-objects/Money";
import type { AccountType, BankAccountProps } from "../types";
import { AccountNumber } from "../value-objects/account-number.vo";

/**
 * Bank account aggregate root for the Banking domain.
 *
 * @example
 * ```ts
 * const account = BankAccount.create({ id: 'acc_123' } as BankAccountProps);
 * ```
 */
export class BankAccount {
	private constructor(
		public readonly id: string,
		public readonly companyId: string,
		private _accountName: string,
		private readonly _accountNumber: AccountNumber,
		public readonly accountType: AccountType,
		public readonly bankName: string,
		public readonly bankCode: string | undefined,
		public readonly branch: string | undefined,
		public readonly currency: Currency,
		private _currentBalance: Money,
		private _availableBalance: Money | undefined,
		private _isActive: boolean,
		private _isDefault: boolean,
		public readonly createdAt: Date,
		private _updatedAt: Date,
	) {}

	static create(props: BankAccountProps): BankAccount {
		const accountNumber = AccountNumber.create(props.accountNumber);
		const currentBalance = Money.fromAmount(
			parseFloat(props.currentBalance),
			props.currency,
		);
		const availableBalance = props.availableBalance
			? Money.fromAmount(parseFloat(props.availableBalance), props.currency)
			: undefined;

		return new BankAccount(
			props.id,
			props.companyId,
			props.accountName,
			accountNumber,
			props.accountType,
			props.bankName,
			props.bankCode,
			props.branch,
			props.currency,
			currentBalance,
			availableBalance,
			props.isActive,
			props.isDefault,
			props.createdAt,
			props.updatedAt,
		);
	}

	get accountName(): string {
		return this._accountName;
	}

	get accountNumber(): string {
		return this._accountNumber.getValue();
	}

	get accountNumberMasked(): string {
		return this._accountNumber.getMasked();
	}

	get currentBalance(): Money {
		return this._currentBalance;
	}

	get availableBalance(): Money {
		return this._availableBalance ?? this._currentBalance;
	}

	get isActive(): boolean {
		return this._isActive;
	}

	get isDefault(): boolean {
		return this._isDefault;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	updateBalance(newBalance: Money): void {
		if (newBalance.getCurrency() !== this.currency) {
			throw new Error(
				`Currency mismatch: expected ${this.currency}, got ${newBalance.getCurrency()}`,
			);
		}

		this._currentBalance = newBalance;
		this._updatedAt = new Date();
	}

	credit(amount: Money): void {
		if (amount.getCurrency() !== this.currency) {
			throw new Error(
				`Currency mismatch: expected ${this.currency}, got ${amount.getCurrency()}`,
			);
		}

		this._currentBalance = this._currentBalance.add(amount);
		this._updatedAt = new Date();
	}

	debit(amount: Money): void {
		if (amount.getCurrency() !== this.currency) {
			throw new Error(
				`Currency mismatch: expected ${this.currency}, got ${amount.getCurrency()}`,
			);
		}

		this._currentBalance = this._currentBalance.subtract(amount);
		this._updatedAt = new Date();
	}

	rename(newName: string): void {
		if (!newName || newName.trim().length < 3) {
			throw new Error("Account name must be at least 3 characters");
		}

		this._accountName = newName.trim();
		this._updatedAt = new Date();
	}

	setAsDefault(): void {
		this._isDefault = true;
		this._updatedAt = new Date();
	}

	removeDefault(): void {
		this._isDefault = false;
		this._updatedAt = new Date();
	}

	deactivate(): void {
		this._isActive = false;
		this._updatedAt = new Date();
	}

	activate(): void {
		this._isActive = true;
		this._updatedAt = new Date();
	}

	hasPositiveBalance(): boolean {
		return this._currentBalance.isPositive();
	}

	hasNegativeBalance(): boolean {
		return this._currentBalance.isNegative();
	}

	isOverdrawn(): boolean {
		if (this.accountType === "CREDIT") {
			return false;
		}
		return this._currentBalance.isNegative();
	}

	toProps(): BankAccountProps {
		return {
			id: this.id,
			companyId: this.companyId,
			accountName: this._accountName,
			accountNumber: this._accountNumber.getValue(),
			accountType: this.accountType,
			bankName: this.bankName,
			bankCode: this.bankCode,
			branch: this.branch,
			currency: this.currency,
			currentBalance: this._currentBalance.getAmount().toFixed(2),
			availableBalance: this._availableBalance?.getAmount().toFixed(2),
			isActive: this._isActive,
			isDefault: this._isDefault,
			createdAt: this.createdAt,
			updatedAt: this._updatedAt,
		};
	}
}
