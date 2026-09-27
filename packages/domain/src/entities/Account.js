import { ACCOUNT_LEVEL_NAMES, getExpectedCodeLength, validateTypeMatchesCode, } from "./account.types";
export { ACCOUNT_LEVEL_NAMES, ACCOUNT_TYPE_CLASSES } from "./account.types";
export class Account {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
        Object.freeze(this);
    }
    static create(props) {
        return new Account(props);
    }
    validateBusinessRules() {
        if (!this.props.code || this.props.code.trim().length === 0)
            throw new Error("El código de cuenta es requerido");
        if (!/^\d+$/.test(this.props.code))
            throw new Error("El código de cuenta debe ser numérico");
        const expectedLength = getExpectedCodeLength(this.props.level);
        if (this.props.code.length !== expectedLength)
            throw new Error(`El código de nivel ${ACCOUNT_LEVEL_NAMES[this.props.level]} debe tener ${expectedLength} dígitos`);
        if (!this.props.name || this.props.name.trim().length === 0)
            throw new Error("El nombre de cuenta es requerido");
        validateTypeMatchesCode(this.props.type, this.props.code);
        if (this.props.balance.getCurrency() !== "PEN")
            throw new Error("El balance principal debe estar en PEN");
        if (this.props.balanceUSD && this.props.balanceUSD.getCurrency() !== "USD")
            throw new Error("El balance USD debe estar en dólares");
    }
    canBeDeleted() {
        return !this.props.isSystem;
    }
    canModifyCoreFields() {
        return !this.props.isSystem;
    }
    canHaveChildren() {
        return this.props.isGroup;
    }
    canHaveTransactions() {
        return !this.props.isGroup;
    }
    isMovementAccount() {
        return !this.props.isGroup;
    }
    isDebitNature() {
        return ["Activo", "Gasto", "Costo"].includes(this.props.type);
    }
    isCreditNature() {
        return ["Pasivo", "Patrimonio", "Ingreso"].includes(this.props.type);
    }
    deactivate() {
        if (!this.props.isActive)
            throw new Error("La cuenta ya está inactiva");
        return new Account({
            ...this.props,
            isActive: false,
            updatedAt: new Date(),
        });
    }
    activate() {
        if (this.props.isActive)
            throw new Error("La cuenta ya está activa");
        return new Account({
            ...this.props,
            isActive: true,
            updatedAt: new Date(),
        });
    }
    toggleStatus() {
        return new Account({
            ...this.props,
            isActive: !this.props.isActive,
            updatedAt: new Date(),
        });
    }
    update(data) {
        if (this.props.isSystem) {
            const restrictedFields = [
                "code",
                "type",
                "level",
                "isGroup",
                "currency",
                "parentId",
            ];
            const attemptedRestricted = restrictedFields.filter((field) => data[field] !== undefined && data[field] !== this.props[field]);
            if (attemptedRestricted.length > 0)
                throw new Error(`No se pueden modificar los campos ${attemptedRestricted.join(", ")} de una cuenta del sistema`);
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
    updateBalance(newBalance, newBalanceUSD) {
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
    equals(other) {
        return !!other && this.props.id === other.props.id;
    }
    isAncestorOf(childCode) {
        return (childCode.startsWith(this.props.code) &&
            childCode.length > this.props.code.length);
    }
    getLevelName() {
        return ACCOUNT_LEVEL_NAMES[this.props.level];
    }
    get id() {
        return this.props.id;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get code() {
        return this.props.code;
    }
    get name() {
        return this.props.name;
    }
    get description() {
        return this.props.description;
    }
    get level() {
        return this.props.level;
    }
    get type() {
        return this.props.type;
    }
    get parentId() {
        return this.props.parentId;
    }
    get isGroup() {
        return this.props.isGroup;
    }
    get isActive() {
        return this.props.isActive;
    }
    get isSystem() {
        return this.props.isSystem;
    }
    get currency() {
        return this.props.currency;
    }
    get destination() {
        return this.props.destination;
    }
    get balance() {
        return this.props.balance;
    }
    get balanceUSD() {
        return this.props.balanceUSD;
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
//# sourceMappingURL=Account.js.map