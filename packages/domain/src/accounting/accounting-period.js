export const ACCOUNTING_PERIOD_STATUS = {
    ABIERTO: "abierto",
    CERRADO_PARCIAL: "cerrado_parcial",
    CERRADO_FINAL: "cerrado_final",
    AUDITADO: "auditado",
};
const ALL_STATUS_VALUES = Object.values(ACCOUNTING_PERIOD_STATUS);
const MIN_YEAR = 2020;
const MAX_YEAR = 2100;
export class AccountingPeriod {
    _year;
    _month;
    _status;
    constructor(_year, _month, _status) {
        this._year = _year;
        this._month = _month;
        this._status = _status;
        Object.freeze(this);
    }
    static create(year, month, status = "abierto") {
        if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
            throw new InvalidAccountingPeriodError(year, month, `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            throw new InvalidAccountingPeriodError(year, month, "Month must be between 1 and 12");
        }
        if (!ALL_STATUS_VALUES.includes(status)) {
            throw new InvalidAccountingPeriodError(year, month, `Invalid status: ${status}`);
        }
        return new AccountingPeriod(year, month, status);
    }
    get year() {
        return this._year;
    }
    get month() {
        return this._month;
    }
    get status() {
        return this._status;
    }
    get periodKey() {
        return `${this._year}-${String(this._month).padStart(2, "0")}`;
    }
    get dateRange() {
        const start = new Date(this._year, this._month - 1, 1, 0, 0, 0, 0);
        const end = new Date(this._year, this._month, 0, 23, 59, 59, 999);
        return { start, end };
    }
    canPostEntry() {
        return this._status === "abierto";
    }
    closePartial() {
        if (this._status !== "abierto") {
            throw new InvalidAccountingTransitionError(this._status, "cerrado_parcial", "Only open periods can be partially closed");
        }
        return new AccountingPeriod(this._year, this._month, "cerrado_parcial");
    }
    closeFinal() {
        if (this._status === "auditado") {
            throw new InvalidAccountingTransitionError(this._status, "cerrado_final", "Audited periods cannot be closed");
        }
        if (this._status === "cerrado_final") {
            return this;
        }
        return new AccountingPeriod(this._year, this._month, "cerrado_final");
    }
    audit() {
        if (this._status !== "cerrado_final") {
            throw new InvalidAccountingTransitionError(this._status, "auditado", "Only final closed periods can be audited");
        }
        return new AccountingPeriod(this._year, this._month, "auditado");
    }
    equals(other) {
        if (!other)
            return false;
        return (this._year === other._year &&
            this._month === other._month &&
            this._status === other._status);
    }
    toString() {
        return `AccountingPeriod(${this.periodKey}, ${this._status})`;
    }
    toJSON() {
        return {
            year: this._year,
            month: this._month,
            status: this._status,
            periodKey: this.periodKey,
        };
    }
    static fromJSON(json) {
        return AccountingPeriod.create(json.year, json.month, json.status);
    }
}
export class InvalidAccountingPeriodError extends Error {
    year;
    month;
    constructor(year, month, message) {
        super(message || `Invalid accounting period: ${year}-${month}`);
        this.year = year;
        this.month = month;
        this.name = "InvalidAccountingPeriodError";
        Object.setPrototypeOf(this, InvalidAccountingPeriodError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            year: this.year,
            month: this.month,
            code: "INVALID_ACCOUNTING_PERIOD",
        };
    }
}
export class InvalidAccountingTransitionError extends Error {
    currentStatus;
    targetStatus;
    constructor(currentStatus, targetStatus, message) {
        super(message || `Invalid transition: ${currentStatus} → ${targetStatus}`);
        this.currentStatus = currentStatus;
        this.targetStatus = targetStatus;
        this.name = "InvalidAccountingTransitionError";
        Object.setPrototypeOf(this, InvalidAccountingTransitionError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            currentStatus: this.currentStatus,
            targetStatus: this.targetStatus,
            code: "INVALID_ACCOUNTING_TRANSITION",
        };
    }
}
//# sourceMappingURL=accounting-period.js.map