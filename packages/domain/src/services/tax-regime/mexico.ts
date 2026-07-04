/**
 * MexicoGeneralRegime — Mexican tax regime implementation.
 *
 * Implements IVA (16%), ISR (variable), and RETENCIONES (IVA/ISR).
 *
 * @module services/tax-regime/mexico
 */

import type { CountryCode } from "../../types/tax-identifier";
import { Money } from "../../value-objects/Money";
import type { TaxRegime } from "./types";

const IVA_RATE = 0.16;
const IVA_RETENTION_RATE = 0.106666; // 2/3 of IVA
const ISR_RETENTION_RATE = 0.10; // 10% on professional services

export class MexicoGeneralRegime implements TaxRegime {
	readonly countryCode: CountryCode = "MX";

	calculate(amount: Money, taxType: string): Money {
		switch (taxType) {
			case "IVA":
				return amount.multiply(IVA_RATE);
			case "IVA_RETENCION":
				return amount.multiply(IVA_RETENTION_RATE);
			case "ISR_RETENCION":
				return amount.multiply(ISR_RETENTION_RATE);
			default:
				throw new Error(`Unknown tax type for Mexico: ${taxType}`);
		}
	}

	getRate(taxType: string): number {
		switch (taxType) {
			case "IVA": return IVA_RATE;
			case "IVA_RETENCION": return IVA_RETENTION_RATE;
			case "ISR_RETENCION": return ISR_RETENTION_RATE;
			default: throw new Error(`Unknown tax type for Mexico: ${taxType}`);
		}
	}

	calculateIVA(baseAmount: Money): { baseAmount: Money; taxAmount: Money; totalAmount: Money; taxRate: number } {
		const taxAmount = baseAmount.multiply(IVA_RATE);
		const totalAmount = baseAmount.add(taxAmount);
		return { baseAmount, taxAmount, totalAmount, taxRate: IVA_RATE };
	}
}
