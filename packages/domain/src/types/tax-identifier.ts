/**
 * TaxIdentifier — Generic fiscal identity abstraction.
 *
 * Each country has its own tax ID system (RUC in Peru, CUIT in Argentina,
 * RFC in Mexico, RUT in Chile). This interface allows the domain to work
 * with any of them through a uniform API.
 *
 * @module types/tax-identifier
 */

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
