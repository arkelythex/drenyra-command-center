/**
 * Agent Configuration
 * Central configuration for AI agent swarm
 * @example
 * ```ts
 * const value: AgentSwarmConfig = {} as AgentSwarmConfig;
 * console.log(value);
 * ```
 */

export interface AgentSwarmConfig {
	// API Keys
	geminiApiKey: string;
	grokApiKey?: string; // Optional if using OpenRouter for Grok
	openRouterApiKey?: string; // Required for Hybrid Strategy

	// OpenRouter Specifics
	siteUrl?: string;
	siteName?: string;

	// Model Selection
	models?: {
		reader?: string; // Default: gemini-3-flash
		parser?: string; // Default: gemini-3-flash or phi-5 via OpenRouter/Local
		validator?: string; // Default: grok-code-fast-1 or deepseek-v3 via OpenRouter
		arbitrator?: string; // Default: gemini-3-flash
	};

	// Performance
	cacheEnabled?: boolean;
	parallelExecution?: boolean;

	// Context Monitoring
	enableContextMonitoring?: boolean; // Enable runtime context monitoring
	contextThreshold?: number; // 0-1, default 0.95 (95%)

	// Context Pruning
	enablePruning?: boolean; // Enable context pruning (default: false)
	pruningStrategy?: "sliding-window" | "summarization" | "disabled"; // default: 'sliding-window'
	maxMessages?: number; // Max non-system messages to keep (default: 6)
	tokenBudgetRatio?: number; // Token budget ratio vs context window (default: 0.95)
	enableSummarization?: boolean; // Enable LLM summarization (default: false)

	// OSE Integration
	enableOSE?: boolean;
	oseConfig?: {
		provider: "simulation" | "nubefact";
		simulationMode?: boolean;
	};

	// Model Router Integration
	routerAdapter?: import("../adapters").RouterAdapter;

	// Error Recovery
	enableErrorRecovery?: boolean;

	// Logging
	logLevel?: "debug" | "info" | "warn" | "error";
	enableMetrics?: boolean;
}

/**
 * Default configuration
 * @example
 * ```ts
 * console.log(DEFAULT_CONFIG);
 * ```
 */

export const DEFAULT_CONFIG: Partial<AgentSwarmConfig> = {
	models: {
		reader: "gemini-3-flash",
		parser: "gemini-3-flash", // Can be swapped for smaller models
		validator: "grok-code-fast-1",
		arbitrator: "gemini-3-flash",
	},
	cacheEnabled: true,
	parallelExecution: true,
	enableContextMonitoring: false,
	contextThreshold: 0.95,
	enablePruning: false,
	pruningStrategy: "sliding-window" as const,
	maxMessages: 6,
	tokenBudgetRatio: 0.95,
	enableSummarization: false,
	enableOSE: false,
	enableErrorRecovery: false,
	logLevel: "info",
	enableMetrics: true,
	siteName: "Arkelythex AI Swarm",
	siteUrl: "https://arkelythexfounders.com",
};

/**
 * Validate configuration
 * @param config - Input for config.
 * @returns Result of validateConfig.
 * @throws Error when validateConfig cannot complete successfully.
 * @example
 * ```ts
 * const result = validateConfig({} as AgentSwarmConfig);
 * console.log(result);
 * ```
 */

export function validateConfig(config: AgentSwarmConfig): void {
	if (!config.geminiApiKey) {
		throw new Error(
			"geminiApiKey is required in AgentSwarmConfig (Reader Agent depends on it)",
		);
	}

	// Ensure at least one secondary provider is available
	if (!config.grokApiKey && !config.openRouterApiKey) {
		throw new Error(
			"Either grokApiKey or openRouterApiKey is required for Validator/Parser agents",
		);
	}

	// API keys should not be empty if provided
	if (config.geminiApiKey.trim() === "") {
		throw new Error("geminiApiKey cannot be empty");
	}

	if (config.grokApiKey && config.grokApiKey.trim() === "") {
		throw new Error("grokApiKey cannot be empty");
	}

	if (config.openRouterApiKey && config.openRouterApiKey.trim() === "") {
		throw new Error("openRouterApiKey cannot be empty");
	}
}

/**
 * Merge with defaults
 * @param config - Input for config.
 * @returns Result of mergeWithDefaults.
 * @example
 * ```ts
 * const result = mergeWithDefaults({} as AgentSwarmConfig);
 * console.log(result);
 * ```
 */

export function mergeWithDefaults(
	config: AgentSwarmConfig,
): Required<AgentSwarmConfig> {
	return {
		...DEFAULT_CONFIG,
		...config,
		models: {
			...DEFAULT_CONFIG.models,
			...config.models,
		},
		// Ensure optional keys are at least empty strings if undefined to satisfy Required<T> signature technically,
		// though application logic should handle empty strings.
		grokApiKey: config.grokApiKey || "",
		openRouterApiKey: config.openRouterApiKey || "",
		siteUrl: config.siteUrl || DEFAULT_CONFIG.siteUrl,
		siteName: config.siteName || DEFAULT_CONFIG.siteName,
	} as Required<AgentSwarmConfig>;
}
