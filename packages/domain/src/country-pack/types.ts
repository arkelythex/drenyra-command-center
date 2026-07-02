import type { CountryCode, TaxIdentifierType } from "../types/tax-identifier";

export interface CountryPack {
	readonly code: CountryCode;
	readonly name: string;
	readonly taxAuthorityName: string;
	readonly defaultCurrency: string;
	readonly locale: string;
	readonly timezone: string;
	readonly taxIdentifierTypes: TaxIdentifierType[];
}
