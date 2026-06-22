/**
 * Arkelythex Agent Definitions
 *
 * Implements Vercel AI SDK 6 Agent abstraction pattern.
 * Each agent is a reusable unit with its own model, instructions, and tools.
 *
 * @since December 2025 - AI-First Architecture
 * @see https://ai-sdk.dev/docs/agents
 */

import { google } from "@ai-sdk/google";
import { fiscalTools, runToolLoop } from "@arkelythex/ai";
import { GEMINI_SYSTEM_INSTRUCTION } from "@arkelythex/infrastructure/ai/context";

export interface AgentConfig {
	name: string;
	modelId: string;
	instructions: string;
}

export interface AgentResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

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

export async function runAgent(
	agent: AgentConfig,
	input: string,
): Promise<AgentResult<string>> {
	try {
		const model = google(agent.modelId as Parameters<typeof google>[0]);

		const result = await runToolLoop({
			model,
			system: agent.instructions,
			prompt: input,
			tools: fiscalTools,
			maxSteps: 5,
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
