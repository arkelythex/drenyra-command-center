/**
 * Harness Module Types.
 *
 * Domain-agnostic types for the agent execution harness,
 * delegation graph, and approval workflow.
 * Zero fiscal imports — all types are generic and reusable.
 *
 * @module @drenyra/platform-core/harness
 */

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

/**
 * Configuration for the delegation graph.
 */
export interface DelegationConfig {
  /** Maximum delegation depth before cycle detection */
  maxDepth: number;
  /** Whether to allow dynamic (runtime-registered) spawn permissions */
  allowDynamicSpawn?: boolean;
  /** Enable strict parent-child validation */
  strictParentValidation?: boolean;
}

/**
 * Configuration for approval gates in the harness.
 */
export interface ApprovalConfig {
  /** List of actions that require approval by default */
  approvalActions: string[];
  /** Default handler invoked when approval is required */
  onApprovalRequired?: (request: ApprovalRequest) => Promise<boolean>;
}

/**
 * A request for approval within the harness.
 */
export interface ApprovalRequest {
  /** The agent requesting approval */
  agentId: string;
  /** The task description */
  task: string;
  /** Run identifier for traceability */
  runId: string;
}

/**
 * Configuration for the evidence store.
 */
export interface EvidenceConfig {
  /** Storage backend for evidence ("sqlite" | "in-memory" | "postgres") */
  backend: string;
  /** Maximum evidence records per run before archiving */
  maxRecordsPerRun?: number;
  /** Enable automatic evidence archiving */
  enableAutoArchive?: boolean;
}

// ──────────────────────────────────────────────
// Delegation Graph Types
// ──────────────────────────────────────────────

/**
 * A node in the delegation graph representing an agent type.
 */
export interface DelegationNode {
  /** Unique node/agent identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** List of agent IDs this node is allowed to spawn */
  maySpawn: readonly string[];
  /** Whether this node's actions require approval */
  requiresApproval?: boolean;
  /** Parent node ID (for hierarchical validation) */
  parent?: string;
  /** Whether this is a leaf node (no further delegation) */
  leaf?: boolean;
}

/**
 * Result of a path-finding operation in the delegation graph.
 */
export interface DelegationPath {
  /** Sequence of node IDs from source to target (inclusive) */
  path: string[];
  /** Whether the path is valid (no cycles, all edges allowed) */
  valid: boolean;
}

// ──────────────────────────────────────────────
// Approval Gate Types
// ──────────────────────────────────────────────

/**
 * A configurable approval gate condition.
 * Returns true if the task matches this gate's criteria.
 */
export type ApprovalCondition = (task: string) => boolean;

/**
 * A configurable gate in the approval workflow.
 */
export interface ApprovalGate {
  /** Unique gate name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Condition that determines if this gate applies */
  condition: ApprovalCondition;
  /** Optional handler that performs the actual approval check */
  handler?: (request: ApprovalRequest) => Promise<boolean>;
}

// ──────────────────────────────────────────────
// Evidence Store Types
// ──────────────────────────────────────────────

/**
 * A piece of evidence recorded during harness execution.
 */
export interface EvidenceRecord {
  /** Unique evidence identifier */
  id: string;
  /** Run identifier this evidence belongs to */
  runId: string;
  /** Evidence type (e.g., "agent-result", "approval-decision", "spawn-plan") */
  type: string;
  /** Evidence content */
  content: unknown;
  /** ISO timestamp of when this evidence was collected */
  timestamp: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Query parameters for retrieving evidence records.
 */
export interface EvidenceQuery {
  /** Filter by run ID */
  runId?: string;
  /** Filter by evidence type */
  type?: string;
  /** Maximum results (default: 50) */
  limit?: number;
}
