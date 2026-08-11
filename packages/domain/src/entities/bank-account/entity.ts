import { Money } from "../../value-objects/Money";
import type { BankAccountProps, BankAccountType, Currency } from "./types";

export class BankAccount {
	private constructor(private readonly props: BankAccountProps) {
		this.validateBusinessRules();
	}

	static create(props: BankAccountProps): BankAccount {
		return new BankAccount(props);
	}

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
			id: 0,
			organizationId: params.organizationId,
			bankName: params.bankName,
			accountNumber: params.accountNumber,
			accountType: params.accountType,
			currency,
			...(params.accountingAccountId !== undefined
				? { accountingAccountId: params.accountingAccountId }
				: {}),
			initialBalance: balance,
			currentBalance: balance,
			...(params.cci !== undefined ? { cci: params.cci } : {}),
			...(params.swiftCode !== undefined ? { swiftCode: params.swiftCode } : {}),
			isActive: true,
			...(params.notes !== undefined ? { notes: params.notes } : {}),
			createdAt: now,
			updatedAt: now,
		});
	}

	private validateBusinessRules(): void {
		if (!this.props.bankName || this.props.bankName.trim() === "") {
			throw new Error("El nombre del banco es requerido");
		}

		if (!this.props.accountNumber || this.props.accountNumber.trim() === "") {
			throw new Error("El número de cuenta es requerido");
		}

		if (this.props.cci && !/^\d{20}$/.test(this.props.cci)) {
			throw new Error("El CCI debe tener 20 dígitos");
		}

		if (
			this.props.swiftCode &&
			!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(this.props.swiftCode)
		) {
			throw new Error("El código SWIFT tiene un formato inválido");
		}

		if (
			this.props.accountType === "DETRACCIONES" &&
			this.props.currency !== "PEN"
		) {
			throw new Error("Las cuentas de detracciones deben ser en Soles (PEN)");
		}

		if (
			this.props.initialBalance.getCurrency() !== this.props.currency ||
			this.props.currentBalance.getCurrency() !== this.props.currency
		) {
			throw new Error(
				"La moneda del saldo debe coincidir con la moneda de la cuenta",
			);
		}
	}

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

	withdraw(amount: Money, _description?: string): BankAccount {
		if (!amount.isPositive()) {
			throw new Error("El monto del retiro debe ser positivo");
		}

		if (amount.getCurrency() !== this.props.currency) {
			throw new Error(`El retiro debe ser en ${this.props.currency}`);
		}

		if (this.props.accountType === "DETRACCIONES") {
		}

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

	update(params: {
		bankName?: string;
		accountType?: BankAccountType;
		accountingAccountId?: string | null;
		cci?: string;
		swiftCode?: string;
		notes?: string;
	}): BankAccount {
		const next: BankAccountProps = {
			...this.props,
			bankName: params.bankName ?? this.props.bankName,
			accountType: params.accountType ?? this.props.accountType,
			...(params.cci !== undefined ? { cci: params.cci } : {}),
			...(params.swiftCode !== undefined ? { swiftCode: params.swiftCode } : {}),
			...(params.notes !== undefined ? { notes: params.notes } : {}),
			updatedAt: new Date(),
		};
		if (params.accountingAccountId === null) {
			delete next.accountingAccountId;
		} else if (params.accountingAccountId !== undefined) {
			next.accountingAccountId = params.accountingAccountId;
		}
		return new BankAccount(next);
	}

	isDetracciones(): boolean {
		return this.props.accountType === "DETRACCIONES";
	}

	getAvailableBalance(): Money {
		return this.props.currentBalance;
	}

	equals(other: BankAccount | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

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

	get notes(): string | undefined {
		return this.props.notes;
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
			bankName: this.props.bankName,
			accountNumber: this.props.accountNumber,
			accountType: this.props.accountType,
			currency: this.props.currency,
			accountingAccountId: this.props.accountingAccountId,
			initialBalance: this.props.initialBalance.toJSON(),
			currentBalance: this.props.currentBalance.toJSON(),
			cci: this.props.cci,
			swiftCode: this.props.swiftCode,
			isActive: this.props.isActive,
			notes: this.props.notes,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
