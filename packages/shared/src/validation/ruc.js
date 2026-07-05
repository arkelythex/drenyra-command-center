const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
export function isValidRUC(ruc) {
	if (!/^\d{11}$/.test(ruc)) {
		return false;
	}
	const actualCheckDigit = Number.parseInt(ruc[10] ?? "0", 10);
	const expectedCheckDigit = calculateExpectedCheckDigit(ruc);
	return expectedCheckDigit === actualCheckDigit;
}
function calculateExpectedCheckDigit(ruc) {
	let sum = 0;
	for (let i = 0; i < 10; i++) {
		const digit = Number.parseInt(ruc[i] ?? "0", 10);
		sum += digit * RUC_WEIGHTS[i];
	}
	const remainder = sum % 11;
	const expected = 11 - remainder;
	if (expected === 10) return 0;
	if (expected === 11) return 1;
	return expected;
}
export function isNumericString(value) {
	return /^\d+$/.test(value);
}
//# sourceMappingURL=ruc.js.map
