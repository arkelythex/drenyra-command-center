/**
 * Drenyra Agent Registry
 *
 * Implements Vercel AI SDK 6 Agent abstraction pattern.
 * Each agent is a reusable unit with its own model, instructions, and tools.
 *
 * @since December 2025 - AI-First Architecture
 * @see https://ai-sdk.dev/docs/agents
 */

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { GEMINI_SYSTEM_INSTRUCTION } from "@drenyra/infrastructure/ai/context";
import type { AgentConfig, AgentResult } from "./types";

// ============================================
// TOOL SCHEMAS (for use with generateText)
// ============================================

export const PCGEAccountSchema = z.object({
	description: z.string().describe("Description of the transaction"),
	amount: z.number().optional().describe("Transaction amount in PEN"),
});

export const IGVCalculationSchema = z.object({
	baseAmount: z.number().describe("Base amount before IGV"),
	includesIGV: z
		.boolean()
		.default(false)
		.describe("Whether the amount already includes IGV"),
});

export const DetractionSchema = z.object({
	amount: z.number().describe("Total invoice amount"),
	serviceType: z
		.enum(["construction", "transport", "rental", "other"])
		.describe("Type of service"),
});

export const RUCValidationSchema = z.object({
	ruc: z.string().length(11).describe("11-digit RUC number"),
});

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

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

export function calculateIGV(baseAmount: number, includesIGV: boolean = false) {
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
) {
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

// ============================================
// AGENT DEFINITIONS
// ============================================

export const taxAdvisorAgent: AgentConfig = {
	name: "TaxAdvisorAgent",
	modelId: "gemini-3-flash",
	instructions: `Eres un asesor tributario peruano experto. Tu rol es:
- Calcular IGV, detracciones y retenciones
- Validar RUCs y datos fiscales
- Asesorar sobre bancarización y cumplimiento SUNAT
- Responder siempre en español peruano con formato claro`,
};

export const classifierAgent: AgentConfig = {
	name: "ClassifierAgent",
	modelId: "gemini-3-flash",
	instructions: GEMINI_SYSTEM_INSTRUCTION,
};

// ============================================
// AGENT RUNNER
// ============================================

export async function runAgent(
	agent: AgentConfig,
	input: string,
): Promise<AgentResult<string>> {
	try {
		const model = google(agent.modelId as Parameters<typeof google>[0]);

		const result = await generateText({
			model,
			system: agent.instructions,
			prompt: input,
		});

		return {
			success: true,
			data: result.text,
		};
	} catch (error) {
		console.error(`[${agent.name}] Error:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
