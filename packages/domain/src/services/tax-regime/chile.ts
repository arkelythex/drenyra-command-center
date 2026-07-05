/**
 * ChileGeneralRegime — Chilean tax regime implementation.
 *
 * IVA 19% standard rate.
 */

import type { CountryCode } from "../../types/tax-identifier";
import type { Money } from "../../value-objects/Money";
import type { TaxRegime } from "./types";

const IVA_RATE = 0.19;

export class ChileGeneralRegime implements TaxRegime {
	readonly countryCode: CountryCode = "CL";

	calculate(amount: Money, taxType: string): Money {
		if (taxType === "IVA") return amount.multiply(IVA_RATE);
		throw new Error(`Unknown tax type for Chile: ${taxType}`);
	}

	getRate(taxType: string): number {
		if (taxType === "IVA") return IVA_RATE;
		throw new Error(`Unknown tax type for Chile: ${taxType}`);
	}

	calculateIVA(baseAmount: Money) {
		const taxAmount = baseAmount.multiply(IVA_RATE);
		const totalAmount = baseAmount.add(taxAmount);
		return { baseAmount, taxAmount, totalAmount, taxRate: IVA_RATE };
	}
}
