/**
 * Fiscal Contracts — source of truth for fiscal rules across stacks.
 *
 * Each contract defines the input/output types and mathematical invariants
 * for a fiscal operation. These contracts are the SINGLE source of truth:
 *   - TypeScript: consumed directly
 *   - Go CLI: validated against via contract tests
 *   - Python data-engine: validated against via contract tests
 *
 * Invariants use mathematical notation (pseudocode) to be language-agnostic.
 * JSON Schema exports allow cross-stack verification.
 *
 * @module @drenyra/domain/fiscal-contracts
 */

// ─── IGV Contract ───────────────────────────────────────────────────────────

/** IGV calculation rate: 18% (standard Peruvian IGV) */
export const IGV_RATE = 0.18 as const;

export interface IGVInput {
	/** Base amount in cents (integer, >= 0) */
	baseCents: number;
}

export interface IGVOutput {
	baseCents: number;
	/** IGV amount in cents = round(baseCents * 0.18) */
	igvCents: number;
	/** Total in cents = baseCents + igvCents */
	totalCents: number;
}

export const IGV_CONTRACT = {
	version: "2.0.0",
	name: "IGV Calculation",
	jurisdiction: "PE",
	lastUpdated: "2026-07-11",
	rate: IGV_RATE,
	input: {
		baseCents: {
			type: "integer",
			min: 0,
			max: 1_000_000_000_00,
			description: "Base amount in cents",
		},
	},
	output: {
		baseCents: { type: "integer", description: "Same as input" },
		igvCents: { type: "integer", description: "IGV amount in cents" },
		totalCents: { type: "integer", description: "Total in cents" },
	},
	formula:
		"igvCents = round(baseCents * 0.18); totalCents = baseCents + igvCents",
	invariants: [
		"totalCents = baseCents + igvCents",
		"igvCents >= 0 when baseCents >= 0",
		"0 <= igvCents / baseCents <= 0.18 when baseCents > 0 (rounding may cause < 0.18)",
	],
} as const;

// ─── RUC Contract ───────────────────────────────────────────────────────────

export interface RUCInput {
	value: string;
}

export interface RUCOutput {
	valid: boolean;
	entityType: "COMPANY" | "PERSON" | "GOVERNMENT" | "UNKNOWN";
	countryCode: "PE";
}

export const RUC_CONTRACT = {
	version: "1.0.0",
	name: "RUC Validation",
	jurisdiction: "PE",
	lastUpdated: "2026-07-11",
	input: {
		value: {
			type: "string",
			pattern: "^\\d{11}$",
			description: "11-digit RUC number",
		},
	},
	output: {
		valid: { type: "boolean" },
		entityType: {
			type: "string",
			enum: ["COMPANY", "PERSON", "GOVERNMENT", "UNKNOWN"],
		},
		countryCode: { type: "string", const: "PE" },
	},
	checksum: {
		algorithm: "Modulo 11",
		weights: [5, 4, 3, 2, 7, 6, 5, 4, 3, 2],
		description: "SUNAT standard RUC check digit validation",
	},
	invariants: [
		"value.length === 11",
		"value matches ^\\d{11}$",
		"check digit = 11 - (sum(digits[0..9] * weights) % 11)",
	],
} as const;

// ─── Detracción Contract ────────────────────────────────────────────────────

export const DETRACCION_CONTRACT = {
	version: "1.0.0",
	name: "SPOT Detraction",
	jurisdiction: "PE",
	lastUpdated: "2026-07-11",
	percentageRange: { min: 1, max: 100 },
	validSpotCodes: ["001", "003", "004", "005", "006"],
	invariants: [
		"percentage IN [1, 100]",
		"spotCode IN validSpotCodes",
		"detractionAmount = operationAmount * percentage / 100",
	],
} as const;

// ─── Money Contract ─────────────────────────────────────────────────────────

export const MONEY_CONTRACT = {
	version: "1.0.0",
	name: "Money Value Object",
	jurisdiction: "PE",
	lastUpdated: "2026-07-11",
	currencies: ["PEN", "USD"],
	precision: "cents (integer, 1 = 0.01 currency unit)",
	range: { minCents: -1_000_000_000_00, maxCents: 1_000_000_000_00 },
	operations: {
		add: "a.cents + b.cents (same currency required)",
		subtract: "a.cents - b.cents >= 0 (same currency required)",
		multiply: "round(a.cents * factor)",
	},
	invariants: [
		"addition is commutative: a + b = b + a",
		"addition is associative: (a + b) + c = a + (b + c)",
		"currency is preserved across operations",
		"multiply by 1 returns same value",
		"multiply by 0 returns zero",
	],
} as const;

// ─── All Contracts Registry ─────────────────────────────────────────────────

export const FISCAL_CONTRACTS = {
	igv: IGV_CONTRACT,
	ruc: RUC_CONTRACT,
	detraccion: DETRACCION_CONTRACT,
	money: MONEY_CONTRACT,
} as const;

export type FiscalContractName = keyof typeof FISCAL_CONTRACTS;

/**
 * Returns all fiscal contracts as JSON for cross-stack consumption.
 * Go and Python test suites can fetch this JSON to verify their implementations.
 */
export function getFiscalContractsJSON(): string {
	return JSON.stringify(FISCAL_CONTRACTS, null, 2);
}

/**
 * Returns a specific contract as JSON.
 */
export function getContractJSON(name: FiscalContractName): string {
	return JSON.stringify(FISCAL_CONTRACTS[name], null, 2);
}
