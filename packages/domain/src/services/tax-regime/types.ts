import type { CountryCode } from "../../types/tax-identifier";
import type { Money } from "../../value-objects/Money";

export interface TaxRegime {
	readonly countryCode: CountryCode;
	calculate(amount: Money, taxType: string): Money;
	getRate(taxType: string): number;
}
