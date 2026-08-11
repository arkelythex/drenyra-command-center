/**
 * FEOS-001 — Universal Financial Workspace Model
 *
 * Canonical workspace model: Org → Portfolio → Company → Period → Workspace.
 * Each workspace represents a focused financial intent (close, reconcile, review).
 * Framework-free, no external dependencies.
 *
 * @module @drenyra/domain/feos/workspace
 */

import type {
  CompanyId,
  OrganizationId,
  PortfolioId,
  WorkspaceId,
  PeriodRef,
  Actor,
  FiscalScope,
  Timestamp,
} from "./types";
import { FeosError, generateId, nowTimestamp } from "./types";

// ============================================================================
// Workspace Operational States (FEOS Canonical)
// ============================================================================

/**
 * Canonical workspace operational states.
 *
 * These are the ONLY valid states for any workspace.
 * No custom states allowed at the workspace level.
 */
export const WORKSPACE_STATE = {
  QUEUED: "queued",
  WORKING: "working",
  VERIFYING: "verifying",
  WAITING_INPUT: "waiting-input",
  WAITING_EVIDENCE: "waiting-evidence",
  WAITING_APPROVAL: "waiting-approval",
  BLOCKED: "blocked",
  COMPLETED: "completed",
  FAILED: "failed",
  UNKNOWN: "unknown",
} as const;

export type WorkspaceState = (typeof WORKSPACE_STATE)[keyof typeof WORKSPACE_STATE];

/**
 * A state group determines rollup behavior.
 */
export type WorkspaceStateGroup =
  | "active"          // queued, working, verifying
  | "waiting"         // waiting-input, waiting-evidence, waiting-approval
  | "blocked"         // blocked
  | "terminal"        // completed, failed
  | "unknown";        // unknown

export function getStateGroup(state: WorkspaceState): WorkspaceStateGroup {
  switch (state) {
    case "queued":
    case "working":
    case "verifying":
      return "active";
    case "waiting-input":
    case "waiting-evidence":
    case "waiting-approval":
      return "waiting";
    case "blocked":
      return "blocked";
    case "completed":
    case "failed":
      return "terminal";
    case "unknown":
      return "unknown";
  }
}

/**
 * Whether this state represents a healthy operational status.
 * UNKNOWN never means success — it's a gap that must be investigated.
 */
export function isWorkspaceHealthy(state: WorkspaceState): boolean {
  return state === "queued" || state === "working" || state === "verifying"
    || state === "completed";
}

/**
 * Whether the workspace is in a terminal state.
 */
export function isWorkspaceTerminal(state: WorkspaceState): boolean {
  return state === "completed" || state === "failed";
}

// ============================================================================
// Valid State Transitions
// ============================================================================

const VALID_TRANSITIONS: Record<WorkspaceState, WorkspaceState[]> = {
  queued: ["working", "blocked", "failed"],
  working: ["verifying", "waiting-input", "waiting-evidence", "waiting-approval", "blocked", "failed"],
  verifying: ["completed", "waiting-approval", "blocked", "working", "failed"],
  "waiting-input": ["working", "blocked", "failed"],
  "waiting-evidence": ["working", "blocked", "failed"],
  "waiting-approval": ["working", "verifying", "blocked", "failed"],
  blocked: ["queued", "working", "failed"],
  completed: [],          // Terminal — no transitions out
  failed: [],             // Terminal — no transitions out
  unknown: ["queued", "failed"], // Unknown can resolve to queued (re-discover) or failed
};

export function isValidTransition(from: WorkspaceState, to: WorkspaceState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// Workspace Intent
// ============================================================================

export const WORKSPACE_INTENT = {
  CLOSE: "close",
  RECONCILE: "reconcile",
  REVIEW: "review",
  INVESTIGATE: "investigate",
  CONFIGURE: "configure",
  REPORT: "report",
  AUDIT: "audit",
  SUBMISSION: "submission",
} as const;

export type WorkspaceIntent = (typeof WORKSPACE_INTENT)[keyof typeof WORKSPACE_INTENT];

// ============================================================================
// Blocking Info
// ============================================================================

export interface BlockingInfo {
  reason: string;
  blockedBy: WorkspaceId[];
  blockedSince: Timestamp;
  blockedByActor?: Actor | undefined;
  unblockInstructions?: string | undefined;
  unblockUrl?: string | undefined;
}

// ============================================================================
// Workspace Props
// ============================================================================

export interface WorkspaceProps {
  id: WorkspaceId;
  organizationId: OrganizationId;
  companyId: CompanyId;
  companyRuc: string;
  period: PeriodRef;
  intent: WorkspaceIntent;
  label: string;
  description?: string | undefined;
  state: WorkspaceState;
  blocking?: BlockingInfo | undefined;
  createdBy: Actor;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp | undefined;
  metadata?: Record<string, unknown> | undefined;
}

// ============================================================================
// Workspace Entity
// ============================================================================

export class Workspace {
  private constructor(private readonly props: WorkspaceProps) {
    Object.freeze(this);
  }

  static create(input: {
    organizationId: OrganizationId;
    companyId: CompanyId;
    companyRuc: string;
    period: PeriodRef;
    intent: WorkspaceIntent;
    label: string;
    description?: string;
    createdBy: Actor;
    metadata?: Record<string, unknown>;
  }): Workspace {
    const now = nowTimestamp();
    return new Workspace({
      id: generateId() as WorkspaceId,
      organizationId: input.organizationId,
      companyId: input.companyId,
      companyRuc: input.companyRuc,
      period: input.period,
      intent: input.intent,
      label: input.label,
      description: input.description,
      state: "queued",
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata,
    });
  }

  static fromProps(props: WorkspaceProps): Workspace {
    return new Workspace(props);
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get id(): WorkspaceId { return this.props.id; }
  get organizationId(): OrganizationId { return this.props.organizationId; }
  get companyId(): CompanyId { return this.props.companyId; }
  get companyRuc(): string { return this.props.companyRuc; }
  get period(): PeriodRef { return this.props.period; }
  get intent(): WorkspaceIntent { return this.props.intent; }
  get label(): string { return this.props.label; }
  get description(): string | undefined { return this.props.description; }
  get state(): WorkspaceState { return this.props.state; }
  get blocking(): BlockingInfo | undefined { return this.props.blocking; }
  get createdBy(): Actor { return this.props.createdBy; }
  get createdAt(): Timestamp { return this.props.createdAt; }
  get updatedAt(): Timestamp { return this.props.updatedAt; }
  get completedAt(): Timestamp | undefined { return this.props.completedAt; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get scope(): FiscalScope {
    return {
      organizationId: this.props.organizationId,
      companyId: this.props.companyId,
      companyRuc: this.props.companyRuc,
      fiscalPeriod: `${this.props.period.year}-${String(this.props.period.month).padStart(2, "0")}`,
    };
  }

  /**
   * The state group for attention rollup.
   */
  get stateGroup(): WorkspaceStateGroup {
    return getStateGroup(this.state);
  }

  /**
   * Whether the workspace is in a healthy operational state.
   */
  get isHealthy(): boolean {
    return isWorkspaceHealthy(this.state);
  }

  /**
   * Whether the workspace is in a terminal state.
   */
  get isTerminal(): boolean {
    return isWorkspaceTerminal(this.state);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  private transition(to: WorkspaceState, extra?: Partial<WorkspaceProps>): Workspace {
    if (!isValidTransition(this.props.state, to)) {
      throw new FeosError(
        "INVALID_WORKSPACE_TRANSITION",
        `Cannot transition from "${this.props.state}" to "${to}"`,
        { from: this.props.state, to },
      );
    }
    const now = nowTimestamp();
    return new Workspace({
      ...this.props,
      ...extra,
      state: to,
      updatedAt: now,
      completedAt: to === "completed" || to === "failed" ? now : this.props.completedAt,
    });
  }

  start(): Workspace {
    return this.transition("working");
  }

  verify(): Workspace {
    return this.transition("verifying");
  }

  markCompleted(): Workspace {
    return this.transition("completed");
  }

  markFailed(_error?: string): Workspace {
    return this.transition("failed");
  }

  waitForInput(): Workspace {
    return this.transition("waiting-input");
  }

  waitForEvidence(): Workspace {
    return this.transition("waiting-evidence");
  }

  waitForApproval(): Workspace {
    return this.transition("waiting-approval");
  }

  block(reason: string, blockedBy: WorkspaceId[], actor?: Actor, instructions?: string): Workspace {
    return this.transition("blocked", {
      blocking: {
        reason,
        blockedBy,
        blockedSince: nowTimestamp(),
        blockedByActor: actor,
        unblockInstructions: instructions,
      },
    });
  }

  unblock(_actor?: Actor): Workspace {
    // Unblocking goes back to queued for re-processing
    return this.transition("queued", {
      blocking: undefined,
    });
  }

  /**
   * Resolve from UNKNOWN state. Requires explicit actor context.
   */
  resolveFromUnknown(to: "queued" | "failed"): Workspace {
    return this.transition(to);
  }

  /**
   * Set to UNKNOWN when workspace is detected but state cannot be determined.
   */
  markUnknown(reason: string): Workspace {
    const now = nowTimestamp();
    return new Workspace({
      ...this.props,
      state: "unknown",
      blocking: {
        reason,
        blockedBy: [],
        blockedSince: now,
      },
      updatedAt: now,
    });
  }

  toProps(): WorkspaceProps {
    return { ...this.props };
  }
}

// ============================================================================
// Portfolio Level — Aggregate of Workspaces
// ============================================================================

/**
 * Aggregated view of all workspaces for a company+period.
 */
export interface PortfolioView {
  organizationId: OrganizationId;
  portfolioId: PortfolioId;
  companies: PortfolioCompanyView[];
  rollup: PortfolioRollup;
  lastUpdated: Timestamp;
}

export interface PortfolioCompanyView {
  companyId: CompanyId;
  companyRuc: string;
  companyName: string;
  workspaces: WorkspaceProps[];
  rollup: PortfolioRollup;
}

export interface PortfolioRollup {
  total: number;
  active: number;
  waiting: number;
  blocked: number;
  completed: number;
  failed: number;
  unknown: number;
  blockingPropagation?: WorkspaceId[]; // IDs of workspaces that are transitively blocked
}

/**
 * Compute a portfolio rollup from workspace props.
 */
export function computePortfolioRollup(workspaces: WorkspaceProps[]): PortfolioRollup {
  const rollup: PortfolioRollup = {
    total: workspaces.length,
    active: 0,
    waiting: 0,
    blocked: 0,
    completed: 0,
    failed: 0,
    unknown: 0,
  };

  for (const ws of workspaces) {
    switch (getStateGroup(ws.state)) {
      case "active": rollup.active++; break;
      case "waiting": rollup.waiting++; break;
      case "blocked": rollup.blocked++; break;
      case "terminal":
        if (ws.state === "completed") rollup.completed++;
        else rollup.failed++;
        break;
      case "unknown": rollup.unknown++; break;
    }
  }

  return rollup;
}
