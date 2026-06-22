/**
 * RUC Validation Module - Browser-compatible implementation
 *
 * Implements the SUNAT Módulo 11 algorithm for validating Peruvian RUC numbers.
 * This is a standalone implementation compatible with both Node.js and browser environments.
 *
 * @module validation/ruc
 * @version 1.0.0
 */

// Weights for the Módulo 11 algorithm (SUNAT standard)
const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/**
 * Validates a Peruvian RUC (Registro Único de Contribuyente) using the Módulo 11 algorithm.
 *
 * A valid RUC consists of:
 * - 11 digits
 * - Correct check digit (dígito verificador) calculated using Módulo 11
 *
 * @param ruc - The RUC string to validate (e.g., "20123456789")
 * @returns `true` if the RUC is valid, `false` otherwise
 *
 * @example
 * ```typescript
 * isValidRUC('20123456789'); // true - valid company RUC
 * isValidRUC('10123456789'); // true - valid person RUC
 * isValidRUC('20123456790'); // false - invalid check digit
 * ```
 *
 * @remarks
 * The Módulo 11 algorithm (SUNAT) works as follows:
 * 1. Multiply first 10 digits by their respective weights: [5,4,3,2,7,6,5,4,3,2]
 * 2. Sum all products
 * 3. Calculate remainder of sum divided by 11
 * 4. Calculate expected check digit: 11 - remainder
 *    - If result is 10, return 0
 *    - If result is 11, return 1
 *    - Otherwise return the result
 * 5. Valid if expected === actual check digit (11th position)
 */
export function isValidRUC(ruc: string): boolean {
	// Validate format: exactly 11 digits
	if (!/^\d{11}$/.test(ruc)) {
		return false;
	}

	// Extract the check digit (11th digit)
	const actualCheckDigit = Number.parseInt(ruc[10] ?? "0", 10);

	// Calculate expected check digit
	const expectedCheckDigit = calculateExpectedCheckDigit(ruc);

	// Valid if expected matches actual
	return expectedCheckDigit === actualCheckDigit;
}

/**
 * Calculates the expected check digit for a RUC using Módulo 11 algorithm.
 *
 * @internal
 */
function calculateExpectedCheckDigit(ruc: string): number {
	let sum = 0;

	for (let i = 0; i < 10; i++) {
		const digit = Number.parseInt(ruc[i] ?? "0", 10);
		sum += digit * RUC_WEIGHTS[i];
	}

	const remainder = sum % 11;
	const expected = 11 - remainder;

	// Special cases per SUNAT algorithm
	if (expected === 10) return 0;
	if (expected === 11) return 1;

	return expected;
}

/**
 * Validates if a string contains only digits
 *
 * @param value - The string to validate
 * @returns `true` if the string contains only digits, `false` otherwise
 */
export function isNumericString(value: string): boolean {
	return /^\d+$/.test(value);
}
