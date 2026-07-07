/**
 * Plugin Interface — the vertical registration contract.
 *
 * Every vertical (fiscal, civic, agro) implements {@link AgenticOSPlugin}
 * to register its domain entities, agents, policies, and approval gates
 * with the Platform Core kernel.
 *
 * Zero fiscal imports — all types here are domain-agnostic.
 *
 * @module @drenyra/platform-core/plugin
 */

import type { SessionManager } from "../mastra/session-manager.js";
import type { AgentType, TaskDefinition } from "../kernel/types.js";

// ──────────────────────────────────────────────
// Registry Interfaces (provided by the kernel)
// ──────────────────────────────────────────────

/**
 * Registry for domain-specific entities and validation rules.
 */
export interface DomainRegistry {
	/** Register a domain entity with an optional schema definition */
	registerEntity(name: string, schema: unknown): void;
	/** Register a validation rule that operates on domain input */
	registerRule(name: string, rule: (input: unknown) => boolean): void;
}

/**
 * Registry for agent types and their capabilities.
 */
export interface AgentRegistry {
	/** Register a new agent type with its factory function */
	registerAgentType(type: AgentType, factory: () => unknown): void;
	/** Assign a capability to an agent type */
	registerCapability(agentType: AgentType, capability: string): void;
}

/**
 * Registry for governance policies.
 */
export interface PolicyRegistry {
	/** Register a named policy definition */
	registerPolicy(name: string, policy: PolicyDefinition): void;
}

/**
 * Registry for approval gates that gate sensitive actions.
 */
export interface ApprovalGateRegistry {
	/** Register a named approval gate */
	registerGate(name: string, gate: ApprovalGate): void;
}

// ──────────────────────────────────────────────
// Policy Types
// ──────────────────────────────────────────────

/**
 * A governance policy that evaluates whether an action is allowed.
 */
export interface PolicyDefinition {
	/** Human-readable description of this policy */
	description: string;
	/** Evaluate the policy against the given context */
	evaluate: (context: PolicyContext) => PolicyResult;
}

/**
 * Context provided to a policy evaluation.
 */
export interface PolicyContext {
	/** The action being performed */
	action: string;
	/** The agent type performing the action */
	agentType: AgentType;
	/** The task being executed */
	task: TaskDefinition;
	/** Optional additional context */
	metadata?: Record<string, unknown>;
}

/**
 * The result of a policy evaluation.
 */
export interface PolicyResult {
	/** Whether the action is allowed */
	allowed: boolean;
	/** Human-readable explanation (required when denied) */
	reason?: string;
	/** Whether this action requires additional approval */
	requiresApproval?: boolean;
}

// ──────────────────────────────────────────────
// Approval Gate Types
// ──────────────────────────────────────────────

/**
 * An approval gate that can block or allow sensitive actions.
 * Gates are evaluated asynchronously and may require human intervention.
 */
export interface ApprovalGate {
	/** Unique gate name */
	name: string;
	/** Human-readable description */
	description: string;
	/** Evaluate an approval request and return a verdict */
	evaluate: (request: ApprovalRequest) => Promise<ApprovalVerdict>;
}

/**
 * A request for approval of a sensitive action.
 */
export interface ApprovalRequest {
	/** Unique request identifier */
	id: string;
	/** The action requiring approval */
	action: string;
	/** The agent requesting approval */
	agentId: string;
	/** The task being executed */
	taskId: string;
	/** Supporting evidence for the request */
	evidence: ApprovalEvidence[];
	/** Optional additional context */
	metadata?: Record<string, unknown>;
}

/**
 * A piece of evidence supporting an approval request.
 */
export interface ApprovalEvidence {
	/** Evidence type (e.g., "balance-check", "approval-chain") */
	type: string;
	/** Evidence content */
	content: unknown;
	/** ISO timestamp of when this evidence was collected */
	timestamp: string;
}

/**
 * The verdict returned by an approval gate.
 */
export interface ApprovalVerdict {
	/** Whether the action is approved */
	approved: boolean;
	/** Who or what approved the action */
	approvedBy?: string;
	/** Human-readable explanation for the verdict */
	reason?: string;
	/** ISO timestamp of the verdict */
	timestamp: string;
}

// ──────────────────────────────────────────────
// Plugin Contract
// ──────────────────────────────────────────────

/**
 * The main plugin contract.
 *
 * Every vertical MUST implement this interface to register its
 * domain entities, agents, policies, and approval gates.
 *
 * @example
 * ```ts
 * const fiscalPlugin: AgenticOSPlugin = {
 *   name: "fiscal",
 *   version: "1.0.0",
 *   description: "Peruvian fiscal compliance vertical",
 *   registerDomain(registry) {
 *     registry.registerEntity("invoice", invoiceSchema);
 *     registry.registerRule("valid-ruc", validateRuc);
 *   },
 *   registerAgents(registry) {
 *     registry.registerAgentType("sunat-filing", () => new SunatFilingAgent());
 *   },
 *   registerPolicies(registry) {
 *     registry.registerPolicy("sunat-readonly", sunatReadonlyPolicy);
 *   },
 *   registerApprovalGates(registry) {
 *     registry.registerGate("sunat-submit", sunatSubmitGate);
 *   },
 * };
 * ```
 */
export interface AgenticOSPlugin {
	/** Unique plugin name (e.g., "fiscal", "civic") */
	name: string;
	/** Semantic version of the plugin */
	version: string;
	/** Human-readable description */
	description: string;
	/** Register domain entities and validation rules */
	registerDomain(registry: DomainRegistry): void;
	/** Register agent types and their capabilities */
	registerAgents(registry: AgentRegistry): void;
	/** Register governance policies */
	registerPolicies(registry: PolicyRegistry): void;
	/** Register approval gates for sensitive actions */
	registerApprovalGates(registry: ApprovalGateRegistry): void;
}

// ──────────────────────────────────────────────
// Drenyra Skill (fiscal skill contract)
// ──────────────────────────────────────────────

/**
 * Context provided to a DrenyraSkill during initialization.
 */
export interface SkillContext {
	sessionManager: SessionManager;
	logger: {
		info: (msg: string) => void;
		warn: (msg: string) => void;
		error: (msg: string) => void;
	};
	config: Record<string, unknown>;
}

/**
 * A fiscal skill that can be loaded dynamically by drenyra-pi.
 *
 * Skills are npm packages that implement this interface and register
 * themselves with the PluginRegistry via `drenyra pi install`.
 *
 * @example
 * ```ts
 * const skill: DrenyraSkill = {
 *   id: "sire-filing",
 *   name: "SIRE Filing",
 *   version: "0.1.0",
 *   description: "Electronic books (SIRE) filing for SUNAT compliance",
 *   async initialize(ctx) {
 *     ctx.logger.info("SIRE Filing skill initialized");
 *   },
 * };
 * export default skill;
 * ```
 */
export interface DrenyraSkill {
	/** Unique skill identifier */
	id: string;
	/** Human-readable name */
	name: string;
	/** Semantic version */
	version: string;
	/** Human-readable description */
	description: string;
	/** Optional list of fiscal strategies this skill provides */
	strategies?: Array<{
		name: string;
		execute: (
			input: unknown,
			context: Record<string, unknown>,
		) => Promise<unknown>;
	}>;
	/** Optional CLI commands provided by this skill */
	commands?: Array<{
		name: string;
		description: string;
		execute: (args: string[]) => Promise<void>;
	}>;
	/** Initialize the skill with runtime dependencies */
	initialize(context: SkillContext): Promise<void>;
}
