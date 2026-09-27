import type { TaxIdentifier } from "../types/tax-identifier";
export declare class RUC implements TaxIdentifier {
    readonly value: string;
    readonly countryCode: "PE";
    readonly type: "RUC";
    private static readonly CHECKSUM_WEIGHTS;
    private static readonly ALLOWED_PREFIXES;
    private constructor();
    static create(value: string): RUC;
    static isValid(ruc: string): boolean;
    private static calculateExpectedCheckDigit;
    getEntityType(): "PERSON" | "COMPANY";
    isPerson(): boolean;
    isCompany(): boolean;
    format(): string;
    toString(): string;
    equals(other: TaxIdentifier | null | undefined): boolean;
    validate(): boolean;
    toJSON(): Record<string, unknown>;
    getBase(): string;
    getCheckDigit(): number;
}
//# sourceMappingURL=RUC.d.ts.map