/**
 * Ollama Local Provider — Configuration & Types
 *
 * Ollama-specific configuration and re-exports for the OpenAI-compatible
 * `/v1/chat/completions` and `/api/tags` endpoints.
 *
 * @module @drenyra/ai/providers/ollama
 */

import type { OllamaConfig } from "../../gateway/types";

/**
 * Default configuration for Ollama client.
 */
export const DEFAULT_CONFIG: OllamaConfig = {
	baseUrl: "http://localhost:11434",
	defaultModel: "llama3",
};
