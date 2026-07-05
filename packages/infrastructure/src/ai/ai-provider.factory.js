import { GeminiAdapter } from "./gemini.adapter";
export function createAIProvider() {
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
//# sourceMappingURL=ai-provider.factory.js.map
