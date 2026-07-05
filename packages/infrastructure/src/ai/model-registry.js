import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
export const AVAILABLE_MODELS = {
	"gemini-3-flash": {
		id: "gemini-3-flash",
		provider: "google",
		tier: "flash",
		costPer1MInput: 0.1,
		costPer1MOutput: 0.4,
		contextWindow: 1_000_000,
		available: true,
	},
	"gemini-3-pro": {
		id: "gemini-3-pro",
		provider: "google",
		tier: "reasoning",
		costPer1MInput: 2.0,
		costPer1MOutput: 12.0,
		contextWindow: 2_000_000,
		available: true,
	},
	"claude-haiku-4.5": {
		id: "claude-3-5-haiku-latest",
		provider: "anthropic",
		tier: "flash",
		costPer1MInput: 1.0,
		costPer1MOutput: 5.0,
		contextWindow: 200_000,
		available: true,
	},
	"claude-sonnet-4.5": {
		id: "claude-sonnet-4-20250514",
		provider: "anthropic",
		tier: "reasoning",
		costPer1MInput: 3.0,
		costPer1MOutput: 15.0,
		contextWindow: 200_000,
		available: true,
	},
	"claude-opus-4.5": {
		id: "claude-opus-4-20250514",
		provider: "anthropic",
		tier: "opus",
		costPer1MInput: 5.0,
		costPer1MOutput: 25.0,
		contextWindow: 200_000,
		available: true,
	},
};
export const TASK_TIER_REQUIREMENTS = {
	ocr: "flash",
	extraction: "flash",
	classification: "flash",
	validation: "reasoning",
	correction: "reasoning",
	analysis: "opus",
	normative_reasoning: "opus",
	fraud_detection: "opus",
};
const DEFAULT_CONFIG = {
	preferredProvider: "google",
	fallbackProvider: "anthropic",
	allowCrossProvider: true,
	maxCostPerRequest: null,
	preferSpeed: true,
};
let currentConfig = { ...DEFAULT_CONFIG };
export function configureModelSelection(config) {
	currentConfig = { ...currentConfig, ...config };
}
export function getModelSelectionConfig() {
	return { ...currentConfig };
}
function instantiateModel(modelKey) {
	const def = AVAILABLE_MODELS[modelKey];
	if (!def) {
		throw new Error(`Unknown model: ${modelKey}`);
	}
	switch (def.provider) {
		case "google":
			return google(def.id);
		case "anthropic":
			return anthropic(def.id);
		case "openai":
			console.warn(
				`[ModelRegistry] OpenAI not available, using Google fallback`,
			);
			return google("gemini-3-flash");
		default:
			throw new Error(`Unknown provider: ${def.provider}`);
	}
}
export function selectModelForTask(task) {
	const requiredTier = TASK_TIER_REQUIREMENTS[task];
	const tierPriority =
		requiredTier === "opus"
			? ["opus", "reasoning", "flash"]
			: requiredTier === "reasoning"
				? ["reasoning", "opus", "flash"]
				: ["flash", "reasoning", "opus"];
	const candidates = Object.entries(AVAILABLE_MODELS)
		.filter(([_, def]) => def.available)
		.filter(([_, def]) => {
			if (!currentConfig.allowCrossProvider) {
				return def.provider === currentConfig.preferredProvider;
			}
			return true;
		})
		.map(([key, def]) => ({ key, def }));
	const sorted = candidates.sort((a, b) => {
		const tierA = tierPriority.indexOf(a.def.tier);
		const tierB = tierPriority.indexOf(b.def.tier);
		if (tierA !== tierB) return tierA - tierB;
		if (
			a.def.provider === currentConfig.preferredProvider &&
			b.def.provider !== currentConfig.preferredProvider
		) {
			return -1;
		}
		if (
			b.def.provider === currentConfig.preferredProvider &&
			a.def.provider !== currentConfig.preferredProvider
		) {
			return 1;
		}
		const costA = a.def.costPer1MInput + a.def.costPer1MOutput;
		const costB = b.def.costPer1MInput + b.def.costPer1MOutput;
		return costA - costB;
	});
	const best = sorted[0];
	if (!best) {
		throw new Error(`No available model for task: ${task}`);
	}
	return {
		model: instantiateModel(best.key),
		modelKey: best.key,
		definition: best.def,
		selectionReason: `Selected ${best.key} (${best.def.tier} tier) for ${task}`,
	};
}
export function getModel(modelKey) {
	return instantiateModel(modelKey);
}
export function getCheapestFlashModel() {
	const flashModels = Object.entries(AVAILABLE_MODELS)
		.filter(([_, def]) => def.tier === "flash" && def.available)
		.sort((a, b) => {
			const costA = a[1].costPer1MInput + a[1].costPer1MOutput;
			const costB = b[1].costPer1MInput + b[1].costPer1MOutput;
			return costA - costB;
		});
	const [key, def] = flashModels[0] ?? [
		"gemini-3-flash",
		AVAILABLE_MODELS["gemini-3-flash"],
	];
	return {
		model: instantiateModel(key),
		modelKey: key,
		definition: def,
		selectionReason: "Cheapest flash model for high-volume processing",
	};
}
export function getComplianceModel() {
	if (AVAILABLE_MODELS["claude-opus-4.5"]?.available) {
		return {
			model: instantiateModel("claude-opus-4.5"),
			modelKey: "claude-opus-4.5",
			definition: AVAILABLE_MODELS["claude-opus-4.5"],
			selectionReason: "Claude Opus for regulatory compliance reasoning",
		};
	}
	return {
		model: instantiateModel("gemini-3-pro"),
		modelKey: "gemini-3-pro",
		definition: AVAILABLE_MODELS["gemini-3-pro"],
		selectionReason: "Gemini Pro as fallback for compliance reasoning",
	};
}
export function estimateCost(modelKey, inputTokens, outputTokens) {
	const def = AVAILABLE_MODELS[modelKey];
	if (!def) {
		return { inputCost: 0, outputCost: 0, totalCost: 0 };
	}
	const inputCost = (inputTokens / 1_000_000) * def.costPer1MInput;
	const outputCost = (outputTokens / 1_000_000) * def.costPer1MOutput;
	return {
		inputCost: Math.round(inputCost * 10000) / 10000,
		outputCost: Math.round(outputCost * 10000) / 10000,
		totalCost: Math.round((inputCost + outputCost) * 10000) / 10000,
	};
}
export const modelFlash = google("gemini-3-flash");
export const modelReasoning = google("gemini-3-pro");
export const modelOpus = google("gemini-3-pro");
export function getModelForTask(task) {
	const taskMap = {
		OCR: "ocr",
		EXTRACTION: "extraction",
		VALIDATION: "validation",
		CORRECTION: "correction",
		ANALYSIS: "analysis",
	};
	return selectModelForTask(taskMap[task] ?? "classification").model;
}
export const OPENROUTER_MODEL_TIERS = {
	reasoning: {
		id: "reasoning",
		models: [
			"anthropic/claude-opus-4.6",
			"google/gemini-3-pro",
			"anthropic/claude-opus-4",
		],
		maxTokens: 8192,
		temperature: 0.3,
		costLimit: 0.5,
	},
	fast: {
		id: "fast",
		models: [
			"anthropic/claude-sonnet-4.5",
			"google/gemini-3-flash",
			"deepseek/deepseek-v3",
		],
		maxTokens: 4096,
		temperature: 0.4,
		costLimit: 0.1,
	},
	code: {
		id: "code",
		models: [
			"deepseek/deepseek-coder-v3",
			"anthropic/claude-opus-4.6",
			"anthropic/claude-sonnet-4.5",
		],
		maxTokens: 16384,
		temperature: 0.1,
		costLimit: 0.3,
	},
	vision: {
		id: "vision",
		models: [
			"google/gemini-3-pro",
			"anthropic/claude-sonnet-4.5",
			"openai/gpt-4o",
		],
		maxTokens: 4096,
		temperature: 0.2,
		costLimit: 0.25,
	},
};
export function getOpenRouterModelForTier(tierId) {
	const tier = OPENROUTER_MODEL_TIERS[tierId];
	if (!tier) {
		throw new Error(
			`Unknown OpenRouter tier: ${tierId}. Available: ${Object.keys(OPENROUTER_MODEL_TIERS).join(", ")}`,
		);
	}
	return tier.models[0];
}
export function getOpenRouterFallbackChain(tierId) {
	const tier = OPENROUTER_MODEL_TIERS[tierId];
	if (!tier) return [];
	return tier.models;
}
export function getOpenRouterTierConfig(tierId) {
	return OPENROUTER_MODEL_TIERS[tierId] || null;
}
//# sourceMappingURL=model-registry.js.map
