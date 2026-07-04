/**
 * ColombiaGeneralRegime — Colombian tax regime implementation.
 *
 * IVA 19% standard rate. ReteIVA (IVA retention) 15%.
 * ReteFuente (income withholding) varies by activity.
 */

import type { CountryCode } from "../../types/tax-identifier";
import { Money } from "../../value-objects/Money";
import type { TaxRegime } from "./types";

const IVA_RATE = 0.19;
const RETE_IVA_RATE = 0.15;

export class ColombiaGeneralRegime implements TaxRegime {
	readonly countryCode: CountryCode = "CO";

	calculate(amount: Money, taxType: string): Money {
		switch (taxType) {
			case "IVA": return amount.multiply(IVA_RATE);
			case "RETE_IVA": return amount.multiply(RETE_IVA_RATE);
			default: throw new Error(`Unknown tax type for Colombia: ${taxType}`);
		}
	}

	getRate(taxType: string): number {
		switch (taxType) {
			case "IVA": return IVA_RATE;
			case "RETE_IVA": return RETE_IVA_RATE;
			default: throw new Error(`Unknown tax type for Colombia: ${taxType}`);
		}
	}

	calculateIVA(baseAmount: Money) {
		const taxAmount = baseAmount.multiply(IVA_RATE);
		const totalAmount = baseAmount.add(taxAmount);
		return { baseAmount, taxAmount, totalAmount, taxRate: IVA_RATE };
	}
}
