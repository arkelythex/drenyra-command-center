import type { DrenyraSubagentName } from "./drenyra-subagents";

/**
 * Agent tier classification levels.
 *
 * - tier0: Root orchestrator (mothership)
 * - tier1: Domain orchestrators
 * - tier2: Specialized orchestrators
 * - tier3: Leaf specialist agents
 * - tier3b: Sub-agents / payload drafters
 */
export const AGENT_TIERS = [
	"tier0",
	"tier1",
	"tier2",
	"tier3",
	"tier3b",
] as const;
export type AgentTier = (typeof AGENT_TIERS)[number];

/**
 * Source system origins for agent definitions.
 * Each constant represents a distinct subsystem in the Drenyra ecosystem.
 */
export const AGENT_SYSTEMS = [
	"cli-delegation",
	"drenyra-core",
	"domain-mock",
	"agent-swarm",
	"api-agents",
	"ai-pipeline",
	"ai-swarm",
	"erp",

	"sunat-visual",
] as const;
export type AgentSystem = (typeof AGENT_SYSTEMS)[number];

/**
 * Known agent capability identifiers.
 * These cover fiscal, development, infrastructure, and business domains.
 */
export const AGENT_CAPABILITIES = [
	"document-processing",
	"ocr",
	"xml-parsing",
	"sunat-validation",
	"bank-reconciliation",
	"ledger-review",
	"invoice-processing",
	"compliance-audit",
	"code-review",
	"test-generation",
	"deployment",
	"monitoring",
	"report-generation",
	"risk-analysis",
	"evidence-tracking",
	"tracing",
	"approval-workflow",
	"data-sync",
	"notification",
	"cost-optimization",
	"security-audit",
	"performance-analysis",
	"migration",
	"integration",
	"hr-payroll",
	"ui-testing",
	"e2e-testing",
	"knowledge-retrieval",
	"task-delegation",
	"orchestration",
	"arbitration",
	"validation",
	"parsing",
	"reading",
	"visual-analysis",
	"accessibility",
	"dependency-checking",
	"schema-validation",
	"api-design",
	"database-optimization",
	"anomaly-detection",
	"nlp-processing",
	"data-visualization",
	"backup-management",
	"incident-response",
	"threat-detection",
	"budget-tracking",
	"usability-testing",
	"access-control",
] as const;
export type AgentCapability = (typeof AGENT_CAPABILITIES)[number];

/**
 * Human approval classes for agent actions.
 */
export const APPROVAL_CLASSES = [
	"not-required",
	"supervisor",
	"financial-controller",
] as const;
export type ApprovalClass = (typeof APPROVAL_CLASSES)[number];

/**
 * Supported interaction surfaces for agent invocation.
 */
export const SUPPORTED_SURFACES = [
	"api",
	"cli",
	"web",
	"workspace",
	"batch",
	"automation",
] as const;
export type SupportedSurface = (typeof SUPPORTED_SURFACES)[number];

/**
 * Canonical entry describing a single agent in the unified registry.
 *
 * All fields are required (some may be null/empty) to ensure
 * every consumer can rely on a consistent shape.
 */
export interface UnifiedAgentEntry {
	id: string;
	name: string;
	system: AgentSystem;
	tier: AgentTier;
	parentId: string | null;
	maySpawn: readonly string[];
	isLeaf: boolean;
	capabilities: readonly AgentCapability[];
	approvalClass: ApprovalClass;
	supportedSurfaces: readonly SupportedSurface[];
	drenyraSubagent: DrenyraSubagentName | null;
	description: string;
	sourcePath: string;
}

/**
 * Type-guard: checks if an agent entry belongs to the given tier.
 *
 * @example
 * ```ts
 * if (isAgentInTier(entry, "tier3")) {
 *   // handle leaf specialist
 * }
 * ```
 */
export function isAgentInTier(
	entry: UnifiedAgentEntry,
	tier: AgentTier,
): boolean {
	return entry.tier === tier;
}
