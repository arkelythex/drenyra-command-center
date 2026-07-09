/**
 * Drenyra Orchestrator — Core Types
 *
 * Defines the type system for delegation routing, skills resolution,
 * memory contracts, review lenses, and work routing ladders.
 */

// ============================================================================
// Work Routing
// ============================================================================

/** The three tiers of work routing. */
export type WorkRoute = "inline-direct" | "simple-delegation" | "sdd";

/** Trigger conditions that mandate delegation. */
export interface DelegationTrigger {
	rule:
		| "4-file-rule"
		| "multi-file-write"
		| "pr-rule"
		| "incident-rule"
		| "long-session"
		| "fresh-review";
	description: string;
	threshold: number | string;
}

/** Decision about how to route a piece of work. */
export interface RouteDecision {
	route: WorkRoute;
	reason: string;
	triggeredBy: DelegationTrigger[];
	recommendedSubagent?: string;
	fallbackNote?: string;
}

// ============================================================================
// Phase Gate
// ============================================================================

/** A single gatekeeper check. */
export interface GatekeeperCheck<I = unknown> {
	name: string;
	description: string;
	check: (
		data: I,
		ctx: GatekeeperContext,
	) => Promise<GatekeeperVerdict> | GatekeeperVerdict;
}

export interface GatekeeperVerdict {
	passed: boolean;
	reasons: string[];
	severity: "BLOCKING" | "WARNING" | "INFO";
	details: Record<string, unknown>;
}

export interface GatekeeperContext {
	scope?: {
		organizationId: string;
		companyId: string;
		companyRuc: string;
		period: string;
	};
	evidenceStore?: { store: (artifact: unknown) => Promise<unknown> };
	previousGates: Map<string, GatekeeperVerdict>;
}

// ============================================================================
// Skills Registry
// ============================================================================

/** A skill entry in the registry. */
export interface SkillEntry {
	name: string;
	description: string;
	trigger: string;
	path: string;
	scope: "global" | "project" | "personal";
}

/** The full skill registry. */
export interface SkillRegistry {
	version: string;
	updatedAt: string;
	skills: SkillEntry[];
}

/** Resolution status of skill loading for a subagent. */
export type SkillResolution =
	| "paths-injected"
	| "fallback-registry"
	| "fallback-path"
	| "none";

// ============================================================================
// Memory Contract
// ============================================================================

/** How memory is managed between orchestrator and subagents. */
export interface MemoryContract {
	/** Who reads context. 'orchestrator' means the parent searches and passes context. */
	readBy: "orchestrator" | "subagent";
	/** Who writes context back. 'subagent' means subagents persist their findings. */
	writeBy: "orchestrator" | "subagent" | "both";
	/** Artifact keys for SDD phase storage. */
	artifactKeys: Record<string, string>;
	/** Whether memory tools are available. */
	memoryAvailable: boolean;
}

/** Default SDD artifact keys for Drenyra fiscal compliance. */
export const DRENYRA_SDD_ARTIFACT_KEYS: Record<string, string> = {
	explore: "sdd/{change}/explore",
	proposal: "sdd/{change}/proposal",
	spec: "sdd/{change}/spec",
	design: "sdd/{change}/design",
	tasks: "sdd/{change}/tasks",
	"apply-progress": "sdd/{change}/apply-progress",
	"verify-report": "sdd/{change}/verify-report",
	"sync-report": "sdd/{change}/sync-report",
	"archive-report": "sdd/{change}/archive-report",
	state: "sdd/{change}/state",
} as const;

// ============================================================================
// Review Lenses
// ============================================================================

/** Available review lenses for code/diff review. */
export type ReviewLens =
	| "review-risk"
	| "review-resilience"
	| "review-readability"
	| "review-reliability"
	| "judgment-day";

/** 4R lens configuration. */
export interface ReviewLensConfig {
	lens: ReviewLens;
	description: string;
	triggerContext: string;
	blocking: boolean;
}

/** The 4R review set. */
export const ALL_4R_LENSES: ReviewLensConfig[] = [
	{
		lens: "review-risk",
		description:
			"Security, permissions, data exposure/loss, architecture, dependencies",
		triggerContext: "auth/** | update/** | security/** | payments/**",
		blocking: true,
	},
	{
		lens: "review-resilience",
		description:
			"Shell/process integration, partial failures, recovery, degraded dependencies",
		triggerContext: "shell integration, error handling, retry logic",
		blocking: true,
	},
	{
		lens: "review-readability",
		description: "Clear naming, structure, maintainability, small refactors",
		triggerContext: "pre-commit, pre-push (advisory)",
		blocking: false,
	},
	{
		lens: "review-reliability",
		description: "Behavior, state, tests, determinism, regressions",
		triggerContext: "behavior changes, test additions, refactors",
		blocking: true,
	},
];

// ============================================================================
// Delivery Automation
// ============================================================================

/** Chained PR strategy. */
export type ChainStrategy = "stacked-to-main" | "feature-branch-chain";

/** Delivery strategy for large changes. */
export type DeliveryStrategy =
	| "ask-on-risk"
	| "auto-chain"
	| "single-pr"
	| "exception-ok";

/** Review workload forecast. */
export interface ReviewWorkloadForecast {
	estimatedLines: number;
	estimatedFiles: number;
	chainedPRsRecommended: boolean;
	chainStrategy?: ChainStrategy;
	deliveryStrategy: DeliveryStrategy;
	decisionNeeded: boolean;
	reason: string;
}

// ============================================================================
// Hooks
// ============================================================================

/** Pre-commit/pre-push/pre-PR hook configuration. */
export interface HookConfig {
	preCommit: {
		enabled: boolean;
		reviewLens: ReviewLens;
		blocking: boolean;
	};
	prePush: {
		enabled: boolean;
		reviewLens: ReviewLens;
		blocking: boolean;
	};
	prePR: {
		enabled: boolean;
		hotPaths: string[];
		lineThreshold: number;
		lenses: ReviewLens[];
		blocking: boolean;
	};
}

/** Default hook configuration for Drenyra. */
export const DEFAULT_HOOK_CONFIG: HookConfig = {
	preCommit: {
		enabled: true,
		reviewLens: "review-readability",
		blocking: false,
	},
	prePush: {
		enabled: true,
		reviewLens: "review-readability",
		blocking: false,
	},
	prePR: {
		enabled: true,
		hotPaths: [
			"**/auth/**",
			"**/security/**",
			"**/fiscal/**",
			"**/sunat/**",
			"**/payments/**",
			"**/compliance/**",
		],
		lineThreshold: 400,
		lenses: [
			"review-risk",
			"review-resilience",
			"review-readability",
			"review-reliability",
		],
		blocking: true,
	},
};
