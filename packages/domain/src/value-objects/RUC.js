import { InvalidRUCError } from "../errors/InvalidRUCError";
export class RUC {
    value;
    countryCode = "PE";
    type = "RUC";
    static CHECKSUM_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    static ALLOWED_PREFIXES = ["10", "15", "16", "17", "20"];
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(value) {
        const sanitized = value.trim();
        if (!RUC.isValid(sanitized)) {
            throw new InvalidRUCError(value);
        }
        return new RUC(sanitized);
    }
    static isValid(ruc) {
        if (!/^\d{11}$/.test(ruc)) {
            return false;
        }
        if (!RUC.ALLOWED_PREFIXES.includes(ruc.slice(0, 2))) {
            return false;
        }
        const checkDigit = Number.parseInt(ruc[10] ?? "0", 10);
        return checkDigit === RUC.calculateExpectedCheckDigit(ruc);
    }
    static calculateExpectedCheckDigit(ruc) {
        let sum = 0;
        for (let i = 0; i < 10; i++) {
            const digit = Number.parseInt(ruc[i] ?? "0", 10);
            sum += digit * (RUC.CHECKSUM_WEIGHTS[i] ?? 0);
        }
        const remainder = sum % 11;
        const expectedCheckDigit = 11 - remainder;
        if (expectedCheckDigit === 10)
            return 0;
        if (expectedCheckDigit === 11)
            return 1;
        return expectedCheckDigit;
    }
    getEntityType() {
        return this.value.startsWith("10") ? "PERSON" : "COMPANY";
    }
    isPerson() {
        return this.getEntityType() === "PERSON";
    }
    isCompany() {
        return this.getEntityType() === "COMPANY";
    }
    format() {
        return `${this.value.slice(0, 2)}-${this.value.slice(2, 10)}-${this.value.slice(10)}`;
    }
    toString() {
        return this.value;
    }
    equals(other) {
        if (!other)
            return false;
        return this.value === other.value;
    }
    validate() {
        return RUC.isValid(this.value);
    }
    toJSON() {
        return {
            value: this.value,
            countryCode: this.countryCode,
            type: this.type,
        };
    }
    getBase() {
        return this.value.slice(0, 10);
    }
    getCheckDigit() {
        return Number.parseInt(this.value[10] ?? "0", 10);
    }
}
//# sourceMappingURL=RUC.js.map