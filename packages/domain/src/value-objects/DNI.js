import { InvalidDNIError } from "../errors/InvalidDNIError";
export class DNI {
    value;
    countryCode = "PE";
    type = "DNI";
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(value) {
        const trimmed = value.trim();
        if (!DNI.isValid(trimmed)) {
            throw new InvalidDNIError(value);
        }
        return new DNI(trimmed);
    }
    static isValid(dni) {
        if (dni.length !== 8) {
            return false;
        }
        if (!/^\d{8}$/.test(dni)) {
            return false;
        }
        return true;
    }
    toString() {
        return this.value;
    }
    format() {
        return `${this.value.slice(0, 2)} ${this.value.slice(2, 5)} ${this.value.slice(5)}`;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this.value === other.value;
    }
    validate() {
        return DNI.isValid(this.value);
    }
    toJSON() {
        return {
            value: this.value,
            countryCode: this.countryCode,
            type: this.type,
        };
    }
    static fromJSON(json) {
        return DNI.create(json.value);
    }
}
//# sourceMappingURL=DNI.js.map