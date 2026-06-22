/**
 * Random data generators for test scenarios.
 *
 * Provides deterministic and non-deterministic random data
 * generation for creating varied test inputs.
 */

/**
 * Generate a random integer between min and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max with given decimal places.
 */
export function randomFloat(min: number, max: number, decimals = 2): number {
	const value = Math.random() * (max - min) + min;
	return Number(value.toFixed(decimals));
}

/**
 * Pick a random element from an array.
 */
export function randomPick<T>(arr: readonly T[]): T {
	if (arr.length === 0) {
		throw new Error("Cannot pick from empty array");
	}
	const index = randomInt(0, arr.length - 1);
	return arr[index] as T;
}

/**
 * Generate a random string of given length.
 */
export function randomString(length = 10): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	return Array.from({ length }, () =>
		chars.charAt(randomInt(0, chars.length - 1)),
	).join("");
}

/**
 * Generate a random email address.
 */
export function randomEmail(domain = "test.pe"): string {
	return `user.${randomString(8)}@${domain}`;
}

/**
 * Generate a random phone number (Peruvian format).
 */
export function randomPhone(): string {
	return `+51 9${randomInt(10000000, 99999999)}`;
}

/**
 * Generate a random RUC that passes Módulo 11 validation.
 *
 * Uses a valid prefix and calculates the correct checksum digit.
 */
export function randomRUC(type: "company" | "person" = "company"): string {
	const prefix = type === "company" ? "20" : "10";
	const base = prefix + randomString(8).replace(/[a-z]/g, "0").slice(0, 8);

	// Calculate Módulo 11 checksum
	const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	let sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += Number(base[i] ?? "0") * (weights[i] ?? 0);
	}
	const remainder = sum % 11;
	let checkDigit = 11 - remainder;
	if (checkDigit === 10) checkDigit = 0;
	if (checkDigit === 11) checkDigit = 1;

	return base + checkDigit;
}

/**
 * Generate a random DNI (8 digits).
 */
export function randomDNI(): string {
	return String(randomInt(10000000, 99999999));
}

/**
 * Generate a random UUID-like string.
 */
export function randomId(prefix = "test"): string {
	return `${prefix}_${randomString(12)}`;
}

/**
 * Generate a random PCGE account code.
 */
export function randomAccountCode(
	level: "1" | "2" | "3" | "4" | "5" = "4",
): string {
	const lengths: Record<string, number> = {
		"1": 2,
		"2": 3,
		"3": 4,
		"4": 5,
		"5": 6,
	};
	const length = lengths[level] ?? 5;
	const firstDigit = randomInt(1, 9);
	const rest = randomString(length - 1).replace(/[a-z]/g, "0");
	return String(firstDigit) + rest.slice(0, length - 1);
}

/**
 * Create a seeded random number generator for deterministic tests.
 *
 * @param seed - Seed value for reproducibility
 * @returns Object with random methods using the seed
 */
export function seededRandom(seed: number) {
	let currentSeed = seed;

	function next(): number {
		// Simple LCG (Linear Congruential Generator)
		currentSeed = (currentSeed * 1664525 + 1013904223) & 0xffffffff;
		return (currentSeed >>> 0) / 0xffffffff;
	}

	return {
		next,
		int: (min: number, max: number): number =>
			Math.floor(next() * (max - min + 1)) + min,
		float: (min: number, max: number, decimals = 2): number =>
			Number((next() * (max - min) + min).toFixed(decimals)),
		pick: <T>(arr: readonly T[]): T =>
			arr[Math.floor(next() * arr.length)] as T,
		string: (length = 10): string => {
			const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
			return Array.from({ length }, () =>
				chars.charAt(Math.floor(next() * chars.length)),
			).join("");
		},
	};
}
