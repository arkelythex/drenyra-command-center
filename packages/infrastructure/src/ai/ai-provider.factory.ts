import type { IAIProvider } from "@drenyra/application";
import { GeminiAdapter } from "./gemini.adapter";

/**
 * createAIProvider operation.
 *
 * @returns Result of createAIProvider.
 * @throws Error when createAIProvider cannot complete successfully.
 * @example
 * ```ts
 * const result = createAIProvider();
 * console.log(result);
 * ```
 */
export function createAIProvider(): IAIProvider {
	const provider = process.env.AI_PROVIDER || "gemini";

	switch (provider) {
		case "gemini": {
			const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
			if (!apiKey || apiKey.length < 10) {
				throw new Error(
					"La API Key de Gemini no está configurada o es demasiado corta. Revisa tu archivo .env",
				);
			}
			return new GeminiAdapter(apiKey);
		}
		case "ollama": {
			throw new Error("Ollama not yet implemented");
		}
		default: {
			throw new Error(`Unknown AI provider: ${provider}`);
		}
	}
}
