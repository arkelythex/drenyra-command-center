import { Money } from "../value-objects/Money";
export const SPOT_CODE_REGISTRY = {
    "001": { code: "001", description: "Transporte de bienes por vía terrestre" },
    "002": { code: "002", description: "Transporte público de pasajeros" },
    "003": { code: "003", description: "Alquiler de bienes muebles" },
    "004": {
        code: "004",
        description: "Mantenimiento y reparación de bienes muebles",
    },
    "005": { code: "005", description: "Intermediación laboral y tercerización" },
    "006": { code: "006", description: "Arrendamiento de bienes inmuebles" },
    "007": { code: "007", description: "Otros servicios empresariales" },
};
export class Detraccion {
    _id;
    _spotCode;
    _percentage;
    _amount;
    _reference;
    _status;
    _createdAt;
    _updatedAt;
    constructor(_id, _spotCode, _percentage, _amount, _reference, _status, _createdAt, _updatedAt) {
        this._id = _id;
        this._spotCode = _spotCode;
        this._percentage = _percentage;
        this._amount = _amount;
        this._reference = _reference;
        this._status = _status;
        this._createdAt = _createdAt;
        this._updatedAt = _updatedAt;
        Object.freeze(this);
    }
    static create(id, spotCode, percentage, amount, reference) {
        if (!id || id.trim().length === 0) {
            throw new InvalidDetraccionError("id", "ID is required");
        }
        if (!SPOT_CODE_REGISTRY[spotCode]) {
            throw new InvalidDetraccionError(spotCode, `Invalid SPOT code: ${spotCode}. Must be one of: ${Object.keys(SPOT_CODE_REGISTRY).join(", ")}`);
        }
        if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
            throw new InvalidDetraccionError(String(percentage), "Percentage must be between 0 and 100");
        }
        if (amount.isZero() || amount.getAmount() <= 0) {
            throw new InvalidDetraccionError(String(amount.getAmount()), "Amount must be positive");
        }
        if (!reference || reference.trim().length === 0) {
            throw new InvalidDetraccionError("reference", "Reference is required");
        }
        const now = new Date();
        return new Detraccion(id.trim(), spotCode, percentage, amount, reference.trim(), "pendiente", now, now);
    }
    get id() {
        return this._id;
    }
    get spotCode() {
        return this._spotCode;
    }
    get spotCodeInfo() {
        return SPOT_CODE_REGISTRY[this._spotCode];
    }
    get percentage() {
        return this._percentage;
    }
    get amount() {
        return this._amount;
    }
    get reference() {
        return this._reference;
    }
    get status() {
        return this._status;
    }
    get createdAt() {
        return new Date(this._createdAt.getTime());
    }
    get updatedAt() {
        return new Date(this._updatedAt.getTime());
    }
    deposit() {
        if (this._status !== "pendiente") {
            throw new InvalidDetraccionTransitionError(this._status, "depositado", "Only pending detractions can be deposited");
        }
        return new Detraccion(this._id, this._spotCode, this._percentage, this._amount, this._reference, "depositado", this._createdAt, new Date());
    }
    use() {
        if (this._status !== "depositado") {
            throw new InvalidDetraccionTransitionError(this._status, "usado", "Only deposited detractions can be used");
        }
        return new Detraccion(this._id, this._spotCode, this._percentage, this._amount, this._reference, "usado", this._createdAt, new Date());
    }
    release() {
        if (this._status !== "depositado") {
            throw new InvalidDetraccionTransitionError(this._status, "liberado", "Only deposited detractions can be released");
        }
        return new Detraccion(this._id, this._spotCode, this._percentage, this._amount, this._reference, "liberado", this._createdAt, new Date());
    }
    isDeposited() {
        return this._status === "depositado";
    }
    isUsed() {
        return this._status === "usado";
    }
    isReleased() {
        return this._status === "liberado";
    }
    equals(other) {
        if (!other)
            return false;
        return (this._id === other._id &&
            this._spotCode === other._spotCode &&
            this._percentage === other._percentage &&
            this._amount.equals(other._amount) &&
            this._status === other._status);
    }
    toString() {
        return `Detraccion(${this._id}, ${this._spotCode}, ${this._status})`;
    }
    toJSON() {
        return {
            id: this._id,
            spotCode: this._spotCode,
            percentage: this._percentage,
            amount: this._amount.toJSON(),
            reference: this._reference,
            status: this._status,
            createdAt: this._createdAt.toISOString(),
            updatedAt: this._updatedAt.toISOString(),
        };
    }
    static fromJSON(json) {
        const money = Money.fromJSON(json.amount);
        return Detraccion.create(json.id, json.spotCode, json.percentage, money, json.reference);
    }
}
export class InvalidDetraccionError extends Error {
    field;
    constructor(field, message) {
        super(message || `Invalid detraccion field: ${field}`);
        this.field = field;
        this.name = "InvalidDetraccionError";
        Object.setPrototypeOf(this, InvalidDetraccionError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            field: this.field,
            code: "INVALID_DETRACCION",
        };
    }
}
export class InvalidDetraccionTransitionError extends Error {
    currentStatus;
    targetStatus;
    constructor(currentStatus, targetStatus, message) {
        super(message ||
            `Invalid detraccion transition: ${currentStatus} → ${targetStatus}`);
        this.currentStatus = currentStatus;
        this.targetStatus = targetStatus;
        this.name = "InvalidDetraccionTransitionError";
        Object.setPrototypeOf(this, InvalidDetraccionTransitionError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            currentStatus: this.currentStatus,
            targetStatus: this.targetStatus,
            code: "INVALID_DETRACCION_TRANSITION",
        };
    }
}
//# sourceMappingURL=detraccion.js.map