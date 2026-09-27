export type CountryCode = "PE" | "AR" | "CL" | "MX" | "CO" | "BR";
export type TaxIdentifierType = "RUC" | "DNI" | "CUIT" | "RUT" | "RFC" | "NIT";
export interface TaxIdentifier {
    readonly value: string;
    readonly countryCode: CountryCode;
    readonly type: TaxIdentifierType;
    validate(): boolean;
    format(): string;
    toString(): string;
    equals(other: TaxIdentifier | null | undefined): boolean;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=tax-identifier.d.ts.map