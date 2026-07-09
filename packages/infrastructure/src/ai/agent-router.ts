/**
 * Agent Router — Maps fiscal tasks to model + delegation configuration.
 * Codex-inspired: each task gets the right model, delegation mode, and budget.
 *
 * @module infrastructure/ai/agent-router
 */

// ─── Delegation Modes (Codex v0.142) ─────────────────────────────────

export type DelegationMode = "disabled" | "explicit-request-only" | "proactive";

// ─── Agent Route Config ──────────────────────────────────────────────

export interface AgentRouteConfig {
	task: string;
	modelTier: string; // "flash" | "reasoning" | "opus"
	delegation: DelegationMode;
	maxTokens: number;
	tokenBudget: number; // Rollout token budget per run
	providerPreference: string; // "google" | "anthropic" | "openai"
	description: string;
}

// ─── Fiscal Agent Routes ─────────────────────────────────────────────

/**
 * Predefined routes for fiscal agent tasks.
 * Each step in the pipeline uses a different model tier + delegation mode.
 */
export const FISCAL_AGENT_ROUTES: AgentRouteConfig[] = [
	{
		task: "document_ingestion",
		modelTier: "flash",
		delegation: "disabled",
		maxTokens: 4_096,
		tokenBudget: 10_000,
		providerPreference: "google",
		description: "OCR and document parsing — fast, cheap, no delegation needed",
	},
	{
		task: "transaction_categorization",
		modelTier: "reasoning",
		delegation: "proactive",
		maxTokens: 8_192,
		tokenBudget: 25_000,
		providerPreference: "anthropic",
		description:
			"PCGE classification with learned patterns — can delegate to sub-agents for large batches",
	},
	{
		task: "tax_calculation",
		modelTier: "flash",
		delegation: "disabled",
		maxTokens: 2_048,
		tokenBudget: 5_000,
		providerPreference: "google",
		description:
			"IGV/detracción calculation — deterministic rules, no AI needed",
	},
	{
		task: "sunat_reconciliation",
		modelTier: "reasoning",
		delegation: "explicit-request-only",
		maxTokens: 8_192,
		tokenBudget: 20_000,
		providerPreference: "anthropic",
		description:
			"Compare local vs SUNAT data — reasoning required, but delegation only on explicit request",
	},
	{
		task: "anomaly_detection",
		modelTier: "opus",
		delegation: "explicit-request-only",
		maxTokens: 16_384,
		tokenBudget: 50_000,
		providerPreference: "anthropic",
		description:
			"Find unusual patterns — highest reasoning tier, controlled delegation",
	},
	{
		task: "report_generation",
		modelTier: "reasoning",
		delegation: "disabled",
		maxTokens: 8_192,
		tokenBudget: 15_000,
		providerPreference: "google",
		description: "Generate exceptions summary and journal entries",
	},
] as const;

// ─── Router ──────────────────────────────────────────────────────────

const routeMap = new Map<string, AgentRouteConfig>(
	FISCAL_AGENT_ROUTES.map((r) => [r.task, r]),
);

/**
 * Get route config for a fiscal task.
 */
export function getRouteForTask(task: string): AgentRouteConfig | undefined {
	return routeMap.get(task);
}

/**
 * Get the model tier for a fiscal task.
 */
export function getModelTierForTask(task: string): string | undefined {
	return routeMap.get(task)?.modelTier;
}

/**
 * Get delegation mode for a fiscal task.
 */
export function getDelegationForTask(task: string): DelegationMode | undefined {
	return routeMap.get(task)?.delegation;
}

/**
 * Check if a task can auto-delegate (proactive mode).
 */
export function canAutoDelegate(task: string): boolean {
	return routeMap.get(task)?.delegation === "proactive";
}

/**
 * Get total token budget for a full pipeline run.
 */
export function getPipelineTokenBudget(): number {
	return FISCAL_AGENT_ROUTES.reduce((sum, r) => sum + r.tokenBudget, 0);
}

/**
 * Filter routes by delegation mode.
 */
export function getRoutesByDelegation(
	mode: DelegationMode,
): AgentRouteConfig[] {
	return FISCAL_AGENT_ROUTES.filter((r) => r.delegation === mode);
}
