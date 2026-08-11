/**
 * BankAccount Entity.
 *
 * @description Represents a commercial bank account within the treasury system.
 * It manages financial liquidity across different currencies and integrates
 * with the Chart of Accounts for automated bookkeeping. Supports specific
 * Peruvian banking concepts like CCI and Detracciones (SPOT).
 *
 * @business_rules
 * - CCI Validation: The Interbank Account Code (CCI) must be exactly 20 digits.
 * - Detracciones (SPOT): Accounts of type 'DETRACCIONES' must strictly use PEN (Soles).
 * - Multi-Currency: Accounts can be PEN or USD; the balance currency must match.
 * - Overdraft: Operations that would result in a negative balance are prohibited
 *   (unless specifically permitted by future credit-line logic).
 *
 * @example
 * ```typescript
 * const savings = BankAccount.createNew({
 *   organizationId: 1,
 *   bankName: "BCP",
 *   accountNumber: "193-1234567-0-12",
 *   accountType: "AHORROS",
 *   currency: "PEN",
 *   initialBalance: 5000
 * });
 * ```
 *
 * @domain Treasury
 * @since 1.0.0
 */

import { Money } from "../value-objects/Money";

/**
 * Supported bank account types (Peru-oriented).
 *
 * @example
 * ```ts
 * const t: BankAccountType = "CORRIENTE";
 * ```
 */
export type BankAccountType =
	| "CORRIENTE" // Checking account
	| "AHORROS" // Savings account
	| "CTS" // CTS (Compensación por Tiempo de Servicios)
	| "DETRACCIONES" // SPOT detractions account
	| "OTRO"; // Other

/**
 * Supported currencies for bank accounts.
 *
 * @example
 * ```ts
 * const c: Currency = "PEN";
 * ```
 */
export type Currency = import("../types/currency").Currency;

/**
 * Properties used to construct a {@link BankAccount}.
 *
 * @example
 * ```ts
 * const props: BankAccountProps = {
 *   id: 0,
 *   organizationId: 1,
 *   bankName: "BCP",
 *   accountNumber: "123",
 *   accountType: "AHORROS",
 *   currency: "PEN",
 *   initialBalance: Money.fromAmount(0, "PEN"),
 *   currentBalance: Money.fromAmount(0, "PEN"),
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface BankAccountProps {
	id: number;
	organizationId: number;
	bankName: string;
	accountNumber: string;
	accountType: BankAccountType;
	currency: Currency;
	accountingAccountId?: string | undefined; // Link to chart of accounts
	initialBalance: Money;
	currentBalance: Money;
	cci?: string | undefined; // Código de Cuenta Interbancaria (20 digits)
	swiftCode?: string | undefined;
	providerId?: string | null; // External bank provider reference
	lastSyncAt?: Date | null; // Last provider sync timestamp
	isActive: boolean;
	notes?: string | undefined;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Bank account aggregate root.
 *
 * @deprecated Use the Banking bounded context entity under `apps/api/src/features/banking/domain/entities`.
 *
 * @example
 * ```ts
 * const acc = BankAccount.createNew({
 *   organizationId: 1,
 *   bankName: "BCP",
 *   accountNumber: "123",
 *   accountType: "AHORROS",
 *   currency: "PEN",
 * });
 * ```
 */
export class BankAccount {
	private constructor(private readonly props: BankAccountProps) {
		this.validateBusinessRules();
	}

	/**
	 * Create a new BankAccount
	 */
	static create(props: BankAccountProps): BankAccount {
		return new BankAccount(props);
	}

	/**
	 * Create a new bank account with initial balance
	 */
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
	}): BankAccount {
		const now = new Date();
		const currency = params.currency;
		const initialAmount = params.initialBalance || 0;
		const balance = Money.fromAmount(initialAmount, currency);

		return new BankAccount({
			id: 0, // Will be assigned by database
			organizationId: params.organizationId,
			bankName: params.bankName,
			accountNumber: params.accountNumber,
			accountType: params.accountType,
			currency,
			accountingAccountId: params.accountingAccountId,
			initialBalance: balance,
			currentBalance: balance,
			cci: params.cci,
			swiftCode: params.swiftCode,
			isActive: true,
			notes: params.notes,
			createdAt: now,
			updatedAt: now,
		});
	}

	/**
	 * Validate business rules
	 */
	private validateBusinessRules(): void {
		// Rule 1: Bank name is required
		if (!this.props.bankName || this.props.bankName.trim() === "") {
			throw new Error("El nombre del banco es requerido");
		}

		// Rule 2: Account number is required
		if (!this.props.accountNumber || this.props.accountNumber.trim() === "") {
			throw new Error("El número de cuenta es requerido");
		}

		// Rule 3: CCI must be 20 digits if provided (Peru standard)
		if (this.props.cci && !/^\d{20}$/.test(this.props.cci)) {
			throw new Error("El CCI debe tener 20 dígitos");
		}

		// Rule 4: SWIFT code format (8-11 alphanumeric)
		if (
			this.props.swiftCode &&
			!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(this.props.swiftCode)
		) {
			throw new Error("El código SWIFT tiene un formato inválido");
		}

		// Rule 5: Detracciones account must be PEN
		if (
			this.props.accountType === "DETRACCIONES" &&
			this.props.currency !== "PEN"
		) {
			throw new Error("Las cuentas de detracciones deben ser en Soles (PEN)");
		}

		// Rule 6: Currency consistency
		if (
			this.props.initialBalance.getCurrency() !== this.props.currency ||
			this.props.currentBalance.getCurrency() !== this.props.currency
		) {
			throw new Error(
				"La moneda del saldo debe coincidir con la moneda de la cuenta",
			);
		}
	}

	/**
	 * Apply a deposit (increase balance)
	 */
	deposit(amount: Money, _description?: string): BankAccount {
		if (!amount.isPositive()) {
			throw new Error("El monto del depósito debe ser positivo");
		}

		if (amount.getCurrency() !== this.props.currency) {
			throw new Error(`El depósito debe ser en ${this.props.currency}`);
		}

		return new BankAccount({
			...this.props,
			currentBalance: this.props.currentBalance.add(amount),
			updatedAt: new Date(),
		});
	}

	/**
	 * Apply a withdrawal (decrease balance)
	 * @throws Error if withdrawal exceeds balance (no overdraft allowed)
	 */
	withdraw(amount: Money, _description?: string): BankAccount {
		if (!amount.isPositive()) {
			throw new Error("El monto del retiro debe ser positivo");
		}

		if (amount.getCurrency() !== this.props.currency) {
			throw new Error(`El retiro debe ser en ${this.props.currency}`);
		}

		// Check for detracciones account special rules
		if (this.props.accountType === "DETRACCIONES") {
			// Detracciones can only be used for specific purposes
			// In production, add validation here
		}

		// Check if there's sufficient balance before subtracting
		// Money.subtract throws if result would be negative
		if (amount.greaterThan(this.props.currentBalance)) {
			throw new Error("Saldo insuficiente para realizar el retiro");
		}

		const newBalance = this.props.currentBalance.subtract(amount);

		return new BankAccount({
			...this.props,
			currentBalance: newBalance,
			updatedAt: new Date(),
		});
	}

	/**
	 * Deactivate the account
	 */
	deactivate(): BankAccount {
		if (!this.props.isActive) {
			throw new Error("La cuenta ya está inactiva");
		}

		return new BankAccount({
			...this.props,
			isActive: false,
			updatedAt: new Date(),
		});
	}

	/**
	 * Reactivate the account
	 */
	reactivate(): BankAccount {
		if (this.props.isActive) {
			throw new Error("La cuenta ya está activa");
		}

		return new BankAccount({
			...this.props,
			isActive: true,
			updatedAt: new Date(),
		});
	}

	/**
	 * Update account details
	 */
	update(params: {
		bankName?: string;
		accountType?: BankAccountType;
		accountingAccountId?: string | null;
		cci?: string;
		swiftCode?: string;
		notes?: string;
	}): BankAccount {
		return new BankAccount({
			...this.props,
			bankName: params.bankName ?? this.props.bankName,
			accountType: params.accountType ?? this.props.accountType,
			accountingAccountId:
				params.accountingAccountId === null
					? undefined
					: (params.accountingAccountId ?? this.props.accountingAccountId),
			cci: params.cci ?? this.props.cci,
			swiftCode: params.swiftCode ?? this.props.swiftCode,
			notes: params.notes ?? this.props.notes,
			updatedAt: new Date(),
		});
	}

	/**
	 * Check if this is a detracciones (SPOT) account
	 */
	isDetracciones(): boolean {
		return this.props.accountType === "DETRACCIONES";
	}

	/**
	 * Link this bank account to an external provider.
	 *
	 * @param providerId - The UUID of the BankProvider to link.
	 * @returns A new BankAccount with the provider reference.
	 */
	linkProvider(providerId: string): BankAccount {
		return new BankAccount({
			...this.props,
			providerId,
			updatedAt: new Date(),
		});
	}

	/**
	 * Mark the bank account as having been synced with its provider.
	 * Updates lastSyncAt to the current timestamp.
	 *
	 * @returns A new BankAccount with updated sync timestamp.
	 */
	markSynced(): BankAccount {
		return new BankAccount({
			...this.props,
			lastSyncAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Get available balance (for detracciones, this may differ from current balance)
	 */
	getAvailableBalance(): Money {
		// For detracciones accounts, available balance may be restricted
		// This is a simplified implementation
		return this.props.currentBalance;
	}

	/**
	 * Check equality by ID
	 */
	equals(other: BankAccount | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	// Getters
	get id(): number {
		return this.props.id;
	}

	get organizationId(): number {
		return this.props.organizationId;
	}

	get bankName(): string {
		return this.props.bankName;
	}

	get accountNumber(): string {
		return this.props.accountNumber;
	}

	get accountType(): BankAccountType {
		return this.props.accountType;
	}

	get currency(): Currency {
		return this.props.currency;
	}

	get accountingAccountId(): string | undefined {
		return this.props.accountingAccountId;
	}

	get initialBalance(): Money {
		return this.props.initialBalance;
	}

	get currentBalance(): Money {
		return this.props.currentBalance;
	}

	get cci(): string | undefined {
		return this.props.cci;
	}

	get swiftCode(): string | undefined {
		return this.props.swiftCode;
	}

	get isActive(): boolean {
		return this.props.isActive;
	}

	get providerId(): string | null {
		return this.props.providerId ?? null;
	}

	get lastSyncAt(): Date | null {
		return this.props.lastSyncAt ?? null;
	}

	get notes(): string | undefined {
		return this.props.notes;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			organizationId: this.props.organizationId,
			bankName: this.props.bankName,
			accountNumber: this.props.accountNumber,
			accountType: this.props.accountType,
			currency: this.props.currency,
			accountingAccountId: this.props.accountingAccountId,
			initialBalance: this.props.initialBalance.toJSON(),
			currentBalance: this.props.currentBalance.toJSON(),
			cci: this.props.cci,
			swiftCode: this.props.swiftCode,
			providerId: this.props.providerId ?? null,
			lastSyncAt: this.props.lastSyncAt?.toISOString() ?? null,
			isActive: this.props.isActive,
			notes: this.props.notes,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
