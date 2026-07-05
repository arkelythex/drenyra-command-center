/**
 * LLM Gateway constants — default config, provider models, status mapping.
 */
import type { LLMProvider } from "./types";

export const DEFAULT_CONFIG = {
	defaultProvider: "openrouter" as LLMProvider,
	enableFailover: true,
	enableRateLimiting: true,
	enableBudgetEnforcement: false,
	timeout: 120000,
};

export const PROVIDER_DEFAULT_MODELS: Record<LLMProvider, string> = {
	anthropic: "anthropic/claude-sonnet-4-20250514",
	openai: "openai/gpt-5",
	google: "google/gemini-2.5-pro-preview-06-05",
	grok: "grok-2-1212",
	openrouter: "openrouter/auto",
	ollama: "llama3",
	deepseek: "deepseek-chat",
};

export const STATUS_CODE_MAPPING: Record<number, string> = {
	401: "INVALID_API_KEY",
	403: "INSUFFICIENT_QUOTA",
	429: "RATE_LIMIT_EXCEEDED",
	500: "PROVIDER_ERROR",
	503: "PROVIDER_UNAVAILABLE",
};

export const OPENROUTER_BASE_URL =
	"https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_HEADERS = {
	"HTTP-Referer": "https://drenyra.io",
	"X-Title": "DRENYRA Fiscal Platform",
};

/** DeepSeek API — OpenAI-compatible, direct access */
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";
export const DEEPSEEK_HEADERS: Record<string, string> = {};
