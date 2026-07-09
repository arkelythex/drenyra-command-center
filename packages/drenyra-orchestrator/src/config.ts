/**
 * Drenyra Orchestrator — Configuration
 *
 * Central configuration for the orchestrator: hooks, review thresholds,
 * memory contract, and delivery defaults.
 */

import type { HookConfig } from "./types";
import { DEFAULT_HOOK_CONFIG } from "./types";

// ============================================================================
// Types
// ============================================================================

/** Pre-commit/pre-push hook blocking behavior. */
export type HookBehavior = "advisory" | "blocking";

/** Complete orchestrator configuration. */
export interface DrenyraOrchestratorConfig {
	/** Hook configuration for pre-commit/pre-push/pre-PR. */
	hooks: HookConfig;
	/** Whether memory/Engram is available. */
	memoryAvailable: boolean;
	/** Default delivery strategy. */
	defaultDeliveryStrategy:
		| "ask-on-risk"
		| "auto-chain"
		| "single-pr"
		| "exception-ok";
	/** Line threshold for chained PR recommendation. */
	reviewLineThreshold: number;
	/** Critical subsystems that trigger 4R review on PR. */
	criticalSubsystems: string[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_CONFIG: DrenyraOrchestratorConfig = {
	hooks: DEFAULT_HOOK_CONFIG,
	memoryAvailable: false,
	defaultDeliveryStrategy: "ask-on-risk",
	reviewLineThreshold: 400,
	criticalSubsystems: [
		"auth",
		"security",
		"fiscal",
		"sunat",
		"compliance",
		"payments",
	],
};

// ============================================================================
// Config Functions
// ============================================================================

/**
 * Create the default orchestrator configuration.
 */
export function createDefaultConfig(
	overrides?: Partial<DrenyraOrchestratorConfig>,
): DrenyraOrchestratorConfig {
	return {
		...DEFAULT_CONFIG,
		...overrides,
		hooks: overrides?.hooks
			? mergeHookConfig(DEFAULT_CONFIG.hooks, overrides.hooks)
			: DEFAULT_CONFIG.hooks,
	};
}

/**
 * Load configuration from an OpenSpec config path.
 * Returns the default config if loading fails.
 */
export async function loadConfig(
	configPath?: string,
): Promise<DrenyraOrchestratorConfig> {
	if (!configPath) {
		return DEFAULT_CONFIG;
	}

	try {
		const content = await readConfigFile(configPath);
		if (!content) {
			return DEFAULT_CONFIG;
		}

		const parsed = JSON.parse(content) as Partial<DrenyraOrchestratorConfig>;
		return {
			...DEFAULT_CONFIG,
			...parsed,
			hooks: parsed.hooks
				? mergeHookConfig(DEFAULT_CONFIG.hooks, parsed.hooks)
				: DEFAULT_CONFIG.hooks,
		};
	} catch {
		return DEFAULT_CONFIG;
	}
}

/**
 * Merge two hook configs.
 */
export function mergeConfig(
	base: DrenyraOrchestratorConfig,
	override: Partial<DrenyraOrchestratorConfig>,
): DrenyraOrchestratorConfig {
	return {
		...base,
		...override,
		hooks: override.hooks
			? mergeHookConfig(base.hooks, override.hooks)
			: base.hooks,
	};
}

// ============================================================================
// Helpers
// ============================================================================

function mergeHookConfig(
	base: HookConfig,
	override: Partial<HookConfig>,
): HookConfig {
	return {
		preCommit: { ...base.preCommit, ...override.preCommit },
		prePush: { ...base.prePush, ...override.prePush },
		prePR: { ...base.prePR, ...override.prePR },
	};
}

async function readConfigFile(_path: string): Promise<string | null> {
	// At runtime, the orchestrator reads the file with available tools.
	// This stub exists for type-safe referencing.
	return null;
}
