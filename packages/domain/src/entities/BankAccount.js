import { Money } from "../value-objects/Money";
export class BankAccount {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
    }
    static create(props) {
        return new BankAccount(props);
    }
    static createNew(params) {
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
    validateBusinessRules() {
        if (!this.props.bankName || this.props.bankName.trim() === "") {
            throw new Error("El nombre del banco es requerido");
        }
        if (!this.props.accountNumber || this.props.accountNumber.trim() === "") {
            throw new Error("El número de cuenta es requerido");
        }
        if (this.props.cci && !/^\d{20}$/.test(this.props.cci)) {
            throw new Error("El CCI debe tener 20 dígitos");
        }
        if (this.props.swiftCode &&
            !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(this.props.swiftCode)) {
            throw new Error("El código SWIFT tiene un formato inválido");
        }
        if (this.props.accountType === "DETRACCIONES" &&
            this.props.currency !== "PEN") {
            throw new Error("Las cuentas de detracciones deben ser en Soles (PEN)");
        }
        if (this.props.initialBalance.getCurrency() !== this.props.currency ||
            this.props.currentBalance.getCurrency() !== this.props.currency) {
            throw new Error("La moneda del saldo debe coincidir con la moneda de la cuenta");
        }
    }
    deposit(amount, _description) {
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
    withdraw(amount, _description) {
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
    deactivate() {
        if (!this.props.isActive) {
            throw new Error("La cuenta ya está inactiva");
        }
        return new BankAccount({
            ...this.props,
            isActive: false,
            updatedAt: new Date(),
        });
    }
    reactivate() {
        if (this.props.isActive) {
            throw new Error("La cuenta ya está activa");
        }
        return new BankAccount({
            ...this.props,
            isActive: true,
            updatedAt: new Date(),
        });
    }
    update(params) {
        return new BankAccount({
            ...this.props,
            bankName: params.bankName ?? this.props.bankName,
            accountType: params.accountType ?? this.props.accountType,
            accountingAccountId: params.accountingAccountId === null
                ? undefined
                : (params.accountingAccountId ?? this.props.accountingAccountId),
            cci: params.cci ?? this.props.cci,
            swiftCode: params.swiftCode ?? this.props.swiftCode,
            notes: params.notes ?? this.props.notes,
            updatedAt: new Date(),
        });
    }
    isDetracciones() {
        return this.props.accountType === "DETRACCIONES";
    }
    linkProvider(providerId) {
        return new BankAccount({
            ...this.props,
            providerId,
            updatedAt: new Date(),
        });
    }
    markSynced() {
        return new BankAccount({
            ...this.props,
            lastSyncAt: new Date(),
            updatedAt: new Date(),
        });
    }
    getAvailableBalance() {
        return this.props.currentBalance;
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    get id() {
        return this.props.id;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get bankName() {
        return this.props.bankName;
    }
    get accountNumber() {
        return this.props.accountNumber;
    }
    get accountType() {
        return this.props.accountType;
    }
    get currency() {
        return this.props.currency;
    }
    get accountingAccountId() {
        return this.props.accountingAccountId;
    }
    get initialBalance() {
        return this.props.initialBalance;
    }
    get currentBalance() {
        return this.props.currentBalance;
    }
    get cci() {
        return this.props.cci;
    }
    get swiftCode() {
        return this.props.swiftCode;
    }
    get isActive() {
        return this.props.isActive;
    }
    get providerId() {
        return this.props.providerId ?? null;
    }
    get lastSyncAt() {
        return this.props.lastSyncAt ?? null;
    }
    get notes() {
        return this.props.notes;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
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
//# sourceMappingURL=BankAccount.js.map