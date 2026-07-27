/**
 * Agent definition — declarative metadata for a fiscal agent.
 *
 * Unlike the current registry's 1,400-line imperative structure,
 * these are lightweight, composable, and runtime-agnostic.
 */

import type { RiskTier } from "./risk-tier";
import type { ApprovalLevel } from "./approval-policy";
import type { Jurisdiction } from "./risk-tier";

/**
 * A named capability this agent can perform.
 */
export interface AgentCapability {
	/** e.g. "sunat.proposal.read", "fiscal.evidence.collect" */
	id: string;
	description: string;
}

/**
 * Declarative definition of a fiscal agent.
 *
 * This replaces the runtime-heavy entries in the current registry
 * with lightweight metadata that a policy enforcer can validate.
 */
export interface AgentDefinition {
	/** Canonical agent ID, e.g. "fiscal-sunat-agent" */
	id: string;
	/** Human-readable name */
	name: string;
	/** Description of the agent's purpose */
	description: string;
	/** Fiscal risk tier */
	riskTier: RiskTier;
	/** Jurisdictions this agent operates in */
	jurisdictions: Jurisdiction[];
	/** Capabilities this agent can perform */
	capabilities: AgentCapability[];
	/** Capabilities explicitly forbidden for this agent */
	forbiddenCapabilities: string[];
	/** Approval level required for this agent's actions */
	approvalLevel: ApprovalLevel;
	/** Parent agent ID in the delegation hierarchy */
	parentId: string | null;
	/** Agent IDs this agent is allowed to spawn */
	maySpawn: readonly string[];
	/** Whether this is a leaf agent (no further delegation) */
	isLeaf: boolean;
	/** Human-readable reference to source of truth */
	sourcePath?: string;
}
