/**
 * Domain service for IGV (Peruvian VAT) calculations
 *
 * Handles IGV calculations with proper precision using cents to avoid
 * floating-point errors. IGV rate is fixed at 18% as per SUNAT regulations.
 *
 * @see https://www.sunat.gob.pe/legislacion/igv/
 * Domain service for IGV calculations using integer cents.
 *
 * @example
 * ```ts
 * const igvService = new IGVDomainService();
 * const result = igvService.calculateIGV(10000);
 * ```
 */

export class IGVDomainService {
	private readonly IGV_RATE = 0.18;

	/**
	 * Calculates IGV from base amount
	 *
	 * @param baseCents - Base amount in cents (must be non-negative)
	 * @returns Object with base, IGV, and total amounts in cents
	 * @throws {Error} If baseCents is negative
	 *
	 * @example
	 * ```typescript
	 * const result = igvService.calculateIGV(10000) // S/ 100.00
	 * // Returns: { baseCents: 10000, igvCents: 1800, totalCents: 11800 }
	 * ```
	 */
	calculateIGV(baseCents: number): {
		baseCents: number;
		igvCents: number;
		totalCents: number;
	} {
		if (baseCents < 0) {
			throw new Error("Base amount cannot be negative");
		}

		const igvCents = Math.round(baseCents * this.IGV_RATE);
		const totalCents = baseCents + igvCents;

		return {
			baseCents,
			igvCents,
			totalCents,
		};
	}

	/**
	 * Validates if IGV calculation is correct within tolerance
	 *
	 * Checks if the provided IGV matches the expected 18% calculation
	 * and if base + IGV = total, allowing 1 cent tolerance for rounding.
	 *
	 * @param baseCents - Base amount in cents
	 * @param igvCents - Provided IGV amount in cents
	 * @param totalCents - Total amount in cents
	 * @returns true if IGV is correctly calculated and total matches
	 *
	 * @example
	 * ```typescript
	 * igvService.validateIGVCalculation(10000, 1800, 11800) // true - correct IGV
	 * igvService.validateIGVCalculation(10000, 2000, 12000) // false - wrong IGV
	 * ```
	 */
	validateIGVCalculation(
		baseCents: number,
		igvCents: number,
		totalCents: number,
	): boolean {
		if (baseCents < 0) return false;

		const expectedIgvCents = Math.round(baseCents * this.IGV_RATE);
		const expectedTotalCents = baseCents + expectedIgvCents;

		// Check IGV is correct within 1 cent tolerance
		const igvDifference = Math.abs(igvCents - expectedIgvCents);
		const totalDifference = Math.abs(totalCents - expectedTotalCents);

		return igvDifference <= 1 && totalDifference <= 1;
	}
}
