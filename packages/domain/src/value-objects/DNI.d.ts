import type { TaxIdentifier } from "../types/tax-identifier";
export declare class DNI implements TaxIdentifier {
    readonly value: string;
    readonly countryCode: "PE";
    readonly type: "DNI";
    private constructor();
    static create(value: string): DNI;
    private static isValid;
    toString(): string;
    format(): string;
    equals(other: TaxIdentifier | null | undefined): boolean;
    validate(): boolean;
    toJSON(): Record<string, unknown>;
    static fromJSON(json: {
        value: string;
    }): DNI;
}
//# sourceMappingURL=DNI.d.ts.map