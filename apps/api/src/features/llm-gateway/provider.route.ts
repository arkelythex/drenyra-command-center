/**
 * LLM Gateway — Provider routes.
 * Handles GET /providers and GET /providers/:provider/health
 */
import {
	LLM_PROVIDER,
	type LLMProvider,
	llmGateway,
} from "@arkelythex/ai/gateway";
import { Elysia, t } from "elysia";
import { authorizeAiSurface } from "../security/ai-surface-access";
import { toHeaderRecord } from "./helpers";

const PROVIDERS = [
	{
		id: "anthropic",
		name: "Anthropic",
		models: ["claude-sonnet-4", "claude-3-5-sonnet"],
		description: "Claude models for reasoning and analysis",
	},
	{
		id: "openai",
		name: "OpenAI",
		models: ["gpt-5", "gpt-4-turbo"],
		description: "GPT models for general purpose",
	},
	{
		id: "google",
		name: "Google",
		models: ["gemini-2.5-pro"],
		description: "Gemini models from Google",
	},
	{
		id: "grok",
		name: "Grok",
		models: ["grok-2"],
		description: "Grok models from xAI",
	},
	{
		id: "openrouter",
		name: "OpenRouter",
		models: ["auto", "anthropic/claude-sonnet-4"],
		description: "Multi-provider aggregator",
	},
	{
		id: "ollama",
		name: "Ollama",
		models: ["llama3", "mistral", "codellama", "phi3"],
		description: "Local LLM inference - no API costs",
	},
];

export const providerRoutes = new Elysia({ name: "llm-gateway-providers" })
	.get(
		"/providers",
		async ({ request, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:state:read",
				resource: "/api/v1/providers",
			});

			if (access.ok === false) {
				set.status = access.status;
				return {
					success: false,
					error: { code: access.code, message: access.error },
				};
			}

			return { success: true, data: { providers: PROVIDERS } };
		},
		{
			detail: {
				summary: "List available providers",
				description:
					"Returns list of supported LLM providers and their models.",
				tags: ["LLM Gateway"],
			},
		},
	)
	.get(
		"/providers/:provider/health",
		async ({ params, request, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:state:read",
				resource: "/api/v1/providers/:provider/health",
			});

			if (access.ok === false) {
				set.status = access.status;
				return {
					success: false,
					error: { code: access.code, message: access.error },
				};
			}

			const provider = params.provider as LLMProvider;

			if (!Object.values(LLM_PROVIDER).includes(provider)) {
				set.status = 400;
				return {
					success: false,
					error: {
						code: "INVALID_PROVIDER",
						message: `Invalid provider: ${provider}`,
					},
				};
			}

			const health = llmGateway.getHealthStatus();
			const providerHealth = health.find((h) => h.provider === provider);

			if (!providerHealth) {
				set.status = 404;
				return {
					success: false,
					error: {
						code: "PROVIDER_NOT_FOUND",
						message: `No health data for provider: ${provider}`,
					},
				};
			}

			return { success: true, data: providerHealth };
		},
		{
			params: t.Object({ provider: t.String() }),
			detail: {
				summary: "Get provider health status",
				description:
					"Returns health and availability status for a specific provider.",
				tags: ["LLM Gateway"],
			},
		},
	);
