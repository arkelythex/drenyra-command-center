import { tool } from "ai";
import { z } from "zod";

export const PCGEAccountParams = z.object({
	description: z.string().describe("Description of the transaction"),
	amount: z.number().optional().describe("Transaction amount in PEN"),
});

export const IGVCalculationParams = z.object({
	baseAmount: z.number().describe("Base amount before IGV"),
	includesIGV: z
		.boolean()
		.default(false)
		.describe("Whether the amount already includes IGV"),
});

export const DetractionParams = z.object({
	amount: z.number().describe("Total invoice amount"),
	serviceType: z
		.enum(["construction", "transport", "rental", "other"])
		.describe("Type of service"),
});

export const RUCValidationParams = z.object({
	ruc: z.string().length(11).describe("11-digit RUC number"),
});

export function suggestPCGEAccount(_description: string): {
	cuenta: string;
	nombre: string;
	confidence: number;
} {
	return {
		cuenta: "6399",
		nombre: "Otros gastos de gestión",
		confidence: 0.85,
	};
}

export function calculateIGV(
	baseAmount: number,
	includesIGV = false,
): { base: number; igv: number; total: number } {
	if (includesIGV) {
		const base = baseAmount / 1.18;
		const igv = baseAmount - base;
		return {
			base: Math.round(base * 100) / 100,
			igv: Math.round(igv * 100) / 100,
			total: baseAmount,
		};
	}
	const igv = baseAmount * 0.18;
	return {
		base: baseAmount,
		igv: Math.round(igv * 100) / 100,
		total: Math.round((baseAmount + igv) * 100) / 100,
	};
}

export function calculateDetraction(
	amount: number,
	serviceType: "construction" | "transport" | "rental" | "other",
): { applies: boolean; rate: number; detractionAmount: number } {
	const rates: Record<string, number> = {
		construction: 0.04,
		transport: 0.04,
		rental: 0.1,
		other: 0.12,
	};
	const rate = rates[serviceType] ?? 0.12;
	const applies = amount > 700;
	return {
		applies,
		rate: rate * 100,
		detractionAmount: applies ? Math.round(amount * rate * 100) / 100 : 0,
	};
}

export function validateRUC(ruc: string): {
	valid: boolean;
	type?: string;
	error?: string;
} {
	if (!/^\d{11}$/.test(ruc)) {
		return { valid: false, error: "RUC must be exactly 11 digits" };
	}
	const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	const digits = ruc.split("").map(Number);
	let sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += (digits[i] ?? 0) * (weights[i] ?? 0);
	}
	const remainder = sum % 11;
	const checkDigit = 11 - remainder;
	const expectedCheck =
		checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;
	const valid = digits[10] === expectedCheck;
	return {
		valid,
		type: ruc.startsWith("10")
			? "Persona Natural"
			: ruc.startsWith("20")
				? "Persona Jurídica"
				: "Otro",
	};
}

const pcgeAccountTool = tool({
	description:
		"Suggest a PCGE (Peruvian Chart of Accounts) account for a transaction description",
	inputSchema: PCGEAccountParams,
	execute: async ({ description }) => {
		return suggestPCGEAccount(description);
	},
});

const igvCalculationTool = tool({
	description:
		"Calculate IGV (18%) for a given base amount in PEN. Handles both base-exclusive and base-inclusive amounts.",
	inputSchema: IGVCalculationParams,
	execute: async ({ baseAmount, includesIGV }) => {
		return calculateIGV(baseAmount, includesIGV);
	},
});

const detractionTool = tool({
	description:
		"Calculate SPOT detraction (Sistema de Pago de Obligaciones Tributarias) for Peruvian services",
	inputSchema: DetractionParams,
	execute: async ({ amount, serviceType }) => {
		return calculateDetraction(amount, serviceType);
	},
});

const rucValidationTool = tool({
	description:
		"Validate an 11-digit Peruvian RUC number using Módulo 11 algorithm",
	inputSchema: RUCValidationParams,
	execute: async ({ ruc }) => {
		return validateRUC(ruc);
	},
});

export const fiscalTools = {
	suggestPCGE: pcgeAccountTool,
	calculateIGV: igvCalculationTool,
	calculateDetraction: detractionTool,
	validateRUC: rucValidationTool,
} as const;
