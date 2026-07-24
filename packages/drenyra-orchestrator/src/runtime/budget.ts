/**
 * SDD-009A — Runtime Budget and Pricing types.
 *
 * Semantics (per T0 addendum):
 * - cacheReadTokens: tokens servidos desde caché.
 * - uncachedInputTokens: entrada procesada normalmente.
 * - cacheHitRate = cacheReadTokens / (cacheReadTokens + uncachedInputTokens)
 * - metricSource y observabilityStatus documentan procedencia.
 * - Precios vinculados a provider, modelo, moneda, fecha efectiva y fuente.
 */

// ============================================================================
// Authority Level
// ============================================================================

export type AuthorityLevel = "R0" | "R1" | "R2" | "R3";

// ============================================================================
// Metrics provenance
// ============================================================================

export type MetricSource =
	| "opencode-stats"
	| "opencode-export"
	| "sqlite"
	| "provider-api";

export type ObservabilityStatus = "OBSERVED" | "ESTIMATED" | "UNOBSERVABLE";

// ============================================================================
// Token observation — T0 addendum semantics
// ============================================================================

export interface TokenObservation {
	/** Tokens servidos desde caché (session.tokens_cache_read). */
	cacheReadTokens: number | "UNOBSERVABLE";

	/** Entrada procesada normalmente (input - cacheRead). */
	uncachedInputTokens: number | "UNOBSERVABLE";

	/** Salida generada (session.tokens_output). */
	outputTokens: number | "UNOBSERVABLE";

	/**
	 * cacheHitRate = cacheReadTokens / (cacheReadTokens + uncachedInputTokens)
	 * Rango 0.0–1.0. Es UNOBSERVABLE si cualquiera de los componentes lo es.
	 */
	cacheHitRate: number | "UNOBSERVABLE";

	/** De dónde se obtuvo esta observación. */
	metricSource: MetricSource;

	/** Si el valor es real, estimado o no disponible. */
	observabilityStatus: ObservabilityStatus;

	/** Notas adicionales sobre la calidad de la observación. */
	notes?: string;
}

// ============================================================================
// Pricing
// ============================================================================

export interface ModelPricing {
	modelId: string;
	provider: string;
	currency: string; // "USD"
	effectiveDate: string; // ISO 8601
	source: string; // URL o referencia

	inputUsdPerMToken: number;
	cachedInputUsdPerMToken: number | "NOT_APPLICABLE";
	outputUsdPerMToken: number;

	contextWindowTokens: number;
	operationalLimitTokens: number; // SDD-009 §5: 128K
}

// ============================================================================
// Agent Runtime Budget — SDD-009A §2.1
// ============================================================================

export type AgentRole =
	| "orchestrator"
	| "explore"
	| "propose"
	| "spec"
	| "design"
	| "tasks"
	| "apply"
	| "verify"
	| "review"
	| "archive";

export interface AgentRuntimeBudget {
	role: AgentRole;
	contextLimitTokens: number; // SDD-009 §5.2
	outputLimitTokens: number;
	warningThresholdTokens: number; // 70% — iniciar poda
	compactionThresholdTokens: number; // 80% — compactar
	reserveTokens: number; // 16K mínimo
	costSoftWarningUsd: number;
	costHardPauseUsd: number;
	modelPricing: ModelPricing;
	sessionAffinityId: string;
	responseCacheEnabled: boolean;
}

// ============================================================================
// Cache cost breakdown — SDD-009A §2.2
// ============================================================================

export interface CacheCostBreakdown {
	normalInputUsd: number | "UNOBSERVABLE";
	cachedInputUsd: number | "UNOBSERVABLE" | "NOT_APPLICABLE";
	outputUsd: number | "UNOBSERVABLE";
	totalUsd: number | "UNOBSERVABLE";
	metricSource: MetricSource;
}

// ============================================================================
// GLM 5.2 pricing (Cloudflare Workers AI)
// ============================================================================

export const GLM_52_CLOUDFLARE_PRICING: ModelPricing = {
	modelId: "@cf/zai-org/glm-5.2",
	provider: "cloudflare-workers-ai",
	currency: "USD",
	effectiveDate: "2026-07-14",
	source: "https://developers.cloudflare.com/workers-ai/models/glm-5.2/",
	inputUsdPerMToken: 1.4,
	cachedInputUsdPerMToken: 0.26,
	outputUsdPerMToken: 4.4,
	contextWindowTokens: 262_144,
	operationalLimitTokens: 128_000,
};

// ============================================================================
// DeepSeek V4 Pro pricing via OpenCode Go (baseline actual)
// Basado en T0 baseline — precios estimados de opencode stats
// ============================================================================

export const DEEPSEEK_V4_PRO_OPENCODE_PRICING: ModelPricing = {
	modelId: "deepseek/deepseek-v4-pro",
	provider: "opencode-go",
	currency: "USD",
	effectiveDate: "2026-07-14",
	source: "T0 baseline — opencode stats (precio observado, no publicado)",
	inputUsdPerMToken: 0.55, // estimado: $0.28 / 608K input ≈ $0.46/M; con cache ~$0.55/M
	cachedInputUsdPerMToken: 0.08,
	outputUsdPerMToken: 2.19, // estimado: $0.28 / (2K output + 487K cache) ≈ $2.19/M output marginal
	contextWindowTokens: 128_000,
	operationalLimitTokens: 128_000,
};

// ============================================================================
// Helpers
// ============================================================================

export function calculateCacheHitRate(
	cacheReadTokens: number | "UNOBSERVABLE",
	uncachedInputTokens: number | "UNOBSERVABLE",
): number | "UNOBSERVABLE" {
	if (
		cacheReadTokens === "UNOBSERVABLE" ||
		uncachedInputTokens === "UNOBSERVABLE"
	) {
		return "UNOBSERVABLE";
	}
	const denominator = cacheReadTokens + uncachedInputTokens;
	if (denominator === 0) return 0;
	return cacheReadTokens / denominator;
}

export function validateBudget(budget: AgentRuntimeBudget): void {
	if (budget.contextLimitTokens > 128_000) {
		throw new Error(
			`contextLimitTokens exceeds maximum of 128000: ${budget.contextLimitTokens}`,
		);
	}
	if (budget.reserveTokens < 16_000) {
		throw new Error(
			`reserveTokens must be at least 16000: ${budget.reserveTokens}`,
		);
	}
	if (budget.warningThresholdTokens >= budget.compactionThresholdTokens) {
		throw new Error(
			"warningThresholdTokens must be less than compactionThresholdTokens",
		);
	}
}
