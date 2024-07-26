/**
 * FEOS-008 — Professional Approval Control Plane
 *
 * Approval workflow for financial actions. Supports single and multi-step
 * approvals, approval policies, and R3 tool integration.
 *
 * Principles:
 * - An approval is bound to an exact candidate, never an intention
 * - Multi-step approvals form a chain where each step must be completed
 * - Approval policies determine who can approve what based on risk/materiality
 * - Every approval generates an immutable receipt
 *
 * @module @drenyra/domain/feos/approval
 */

import type { Actor, FiscalScope, Timestamp } from "./types";
import { FeosError, generateId, nowTimestamp } from "./types";
import type { ToolRiskLevel } from "./tool-contract";

// ============================================================================
// Approval Status
// ============================================================================

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

// ============================================================================
// Approval Policy — who can approve what
// ============================================================================

export type PolicyRuleType = "role" | "user" | "group" | "risk_based" | "dual";

export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  /** The minimum risk level that triggers this policy. */
  minRiskLevel: ToolRiskLevel;
  /** Maximum monetary amount that can be approved with this policy (0 = no limit). */
  maxAmount: number;
  /** Currency for maxAmount. */
  currency?: string;
  /** Required approver roles. */
  requiredRoles: string[];
  /** Required approver user IDs (alternative to roles). */
  requiredUsers?: string[];
  /** Whether this requires dual approval (2 approvers). */
  requiresDualApproval: boolean;
  /** Organization scope. */
  organizationId: string;
  /** Whether this policy is active. */
  active: boolean;
}

// ============================================================================
// Approval Step — one step in a multi-step chain
// ============================================================================

export interface ApprovalStep {
  id: string;
  order: number;
  label: string;
  status: ApprovalStatus;
  assignedTo: Actor[];
  approvedBy?: Actor;
  rejectedBy?: Actor;
  rejectionReason?: string;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  policyId?: string;
}

// ============================================================================
// Approval Request
// ============================================================================

export interface ApprovalRequestProps {
  id: string;
  title: string;
  description: string;
  /** The action that requires approval (e.g. "submit_sire_filing", "approve_close"). */
  action: string;
  /** Risk level of the action. */
  riskLevel: ToolRiskLevel;
  /** The candidate input that was reviewed (frozen at request time). */
  candidateInput: unknown;
  /** The expected output (optional, for verification). */
  expectedOutput?: unknown;
  /** Fiscal scope. */
  scope: FiscalScope;
  /** Who requested the approval. */
  requestedBy: Actor;
  /** Current overall status. */
  status: ApprovalStatus;
  /** Approval steps (single or multi-step). */
  steps: ApprovalStep[];
  /** Evidence root ID if evidence was attached. */
  evidenceRootId?: string;
  /** Trace ID for correlation. */
  traceId: string;
  /** Materiality amount if applicable. */
  amount?: number;
  /** Currency for amount. */
  currency?: string;
  /** Deadline for approval. */
  deadline?: Timestamp;
  /** When the request was created. */
  createdAt: Timestamp;
  /** When the request was last updated. */
  updatedAt: Timestamp;
  /** When the request was resolved (approved/rejected). */
  resolvedAt?: Timestamp;
  /** Whether this request has expired. */
  expired: boolean;
  /** Tags for filtering. */
  tags?: string[];
  /** Metadata. */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Approval Request Entity
// ============================================================================

export class ApprovalRequest {
  private constructor(private readonly props: ApprovalRequestProps) {
    Object.freeze(this);
  }

  /**
   * Create a new approval request with a single default step.
   */
  static create(input: {
    title: string;
    description: string;
    action: string;
    riskLevel: ToolRiskLevel;
    candidateInput: unknown;
    expectedOutput?: unknown;
    scope: FiscalScope;
    requestedBy: Actor;
    assignedTo: Actor[];
    traceId: string;
    amount?: number;
    currency?: string;
    deadline?: Timestamp;
    evidenceRootId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): ApprovalRequest {
    const now = nowTimestamp();
    const step: ApprovalStep = {
      id: generateId(),
      order: 1,
      label: `Approval for ${input.action}`,
      status: "pending",
      assignedTo: input.assignedTo,
    };

    const steps = input.riskLevel === "R3" && input.amount && input.amount > 10000
      ? [
          step,
          {
            id: generateId(),
            order: 2,
            label: "Senior approval (amount > 10,000)",
            status: "pending",
            assignedTo: [],
          },
        ]
      : [step];

    return new ApprovalRequest({
      id: generateId(),
      title: input.title,
      description: input.description,
      action: input.action,
      riskLevel: input.riskLevel,
      candidateInput: input.candidateInput,
      expectedOutput: input.expectedOutput,
      scope: input.scope,
      requestedBy: input.requestedBy,
      status: "pending",
      steps,
      evidenceRootId: input.evidenceRootId,
      traceId: input.traceId,
      amount: input.amount,
      currency: input.currency,
      deadline: input.deadline,
      createdAt: now,
      updatedAt: now,
      expired: false,
      tags: input.tags,
      metadata: input.metadata,
    });
  }

  static fromProps(props: ApprovalRequestProps): ApprovalRequest {
    return new ApprovalRequest(props);
  }

  // ─── Getters ────────────────────────────────────────────────────────────

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get action(): string { return this.props.action; }
  get riskLevel(): ToolRiskLevel { return this.props.riskLevel; }
  get status(): ApprovalStatus { return this.props.status; }
  get steps(): ApprovalStep[] { return this.props.steps; }
  get requestedBy(): Actor { return this.props.requestedBy; }
  get scope(): FiscalScope { return this.props.scope; }
  get amount(): number | undefined { return this.props.amount; }
  get isResolved(): boolean {
    return this.props.status === "approved" || this.props.status === "rejected";
  }

  /**
   * Get the current pending step (the first step that's still pending).
   */
  get currentStep(): ApprovalStep | undefined {
    return this.props.steps.find((s) => s.status === "pending");
  }

  /**
   * Whether all steps are completed (all approved or any rejected).
   */
  get allStepsResolved(): boolean {
    return this.props.steps.every((s) => s.status !== "pending");
  }

  // ─── Actions ────────────────────────────────────────────────────────────

  /**
   * Approve the current pending step.
   * If all steps are approved, the overall request becomes approved.
   */
  approve(actor: Actor, stepId?: string): ApprovalRequest {
    if (this.props.status !== "pending") {
      throw new FeosError(
        "APPROVAL_NOT_PENDING",
        `Cannot approve: request is "${this.props.status}"`,
        { status: this.props.status },
      );
    }

    const targetStep = stepId
      ? this.props.steps.find((s) => s.id === stepId)
      : this.currentStep;

    if (!targetStep || targetStep.status !== "pending") {
      throw new FeosError(
        "STEP_NOT_PENDING",
        `Step "${stepId ?? "current"}" is not pending`,
      );
    }

    const now = nowTimestamp();
    const updatedSteps = this.props.steps.map((s) =>
      s.id === targetStep.id
        ? { ...s, status: "approved" as const, approvedBy: actor, approvedAt: now }
        : s,
    );

    const allApproved = updatedSteps.every((s) => s.status === "approved");
    const anyRejected = updatedSteps.some((s) => s.status === "rejected");

    return new ApprovalRequest({
      ...this.props,
      steps: updatedSteps,
      status: allApproved ? "approved" : anyRejected ? "rejected" : "pending",
      updatedAt: now,
      resolvedAt: allApproved || anyRejected ? now : undefined,
    });
  }

  /**
   * Reject the current pending step.
   * Rejection of any step rejects the entire request.
   */
  reject(actor: Actor, reason: string, stepId?: string): ApprovalRequest {
    if (this.props.status !== "pending") {
      throw new FeosError(
        "APPROVAL_NOT_PENDING",
        `Cannot reject: request is "${this.props.status}"`,
        { status: this.props.status },
      );
    }

    const targetStep = stepId
      ? this.props.steps.find((s) => s.id === stepId)
      : this.currentStep;

    if (!targetStep || targetStep.status !== "pending") {
      throw new FeosError(
        "STEP_NOT_PENDING",
        `Step "${stepId ?? "current"}" is not pending`,
      );
    }

    const now = nowTimestamp();
    const updatedSteps = this.props.steps.map((s) =>
      s.id === targetStep.id
        ? { ...s, status: "rejected" as const, rejectedBy: actor, rejectionReason: reason, rejectedAt: now }
        : s,
    );

    return new ApprovalRequest({
      ...this.props,
      steps: updatedSteps,
      status: "rejected",
      updatedAt: now,
      resolvedAt: now,
    });
  }

  /**
   * Cancel the approval request (only possible if still pending).
   */
  cancel(actor: Actor): ApprovalRequest {
    if (this.props.status !== "pending") {
      throw new FeosError(
        "APPROVAL_NOT_PENDING",
        `Cannot cancel: request is "${this.props.status}"`,
        { status: this.props.status },
      );
    }

    const now = nowTimestamp();
    return new ApprovalRequest({
      ...this.props,
      status: "cancelled",
      updatedAt: now,
    });
  }

  /**
   * Mark the request as expired.
   */
  expire(): ApprovalRequest {
    const now = nowTimestamp();
    return new ApprovalRequest({
      ...this.props,
      status: "expired",
      expired: true,
      updatedAt: now,
    });
  }

  toProps(): ApprovalRequestProps {
    return { ...this.props };
  }
}

// ============================================================================
// Policy Evaluation
// ============================================================================

/**
 * Evaluate which approval policies apply to a given action.
 */
export function evaluatePolicies(
  policies: ApprovalPolicy[],
  action: {
    riskLevel: ToolRiskLevel;
    amount?: number;
    currency?: string;
    organizationId: string;
  },
): ApprovalPolicy[] {
  return policies.filter((p) => {
    if (!p.active) return false;
    if (p.organizationId !== action.organizationId) return false;

    const riskOrder: Record<ToolRiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };
    if (riskOrder[p.minRiskLevel] > riskOrder[action.riskLevel]) return false;

    if (p.maxAmount > 0 && action.amount && action.amount > p.maxAmount) {
      return false;
    }

    return true;
  });
}

// ============================================================================
// Approval Store Interface
// ============================================================================

export interface ApprovalStore {
  create(request: ApprovalRequest): Promise<void>;
  get(id: string): Promise<ApprovalRequest | null>;
  update(request: ApprovalRequest): Promise<void>;
  list(filter: ApprovalFilter): Promise<ApprovalRequest[]>;
  listPendingFor(actorId: string): Promise<ApprovalRequest[]>;
}

export interface ApprovalFilter {
  status?: ApprovalStatus;
  organizationId?: string;
  companyId?: string;
  requestedBy?: string;
  riskLevel?: ToolRiskLevel;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Default Policies
// ============================================================================

export const DRENYRA_DEFAULT_POLICIES: ApprovalPolicy[] = [
  {
    id: "policy-r0-r1",
    name: "R0/R1 — No approval required",
    description: "Read-only and low-risk actions require no approval",
    minRiskLevel: "R3", // Never triggers for R0/R1/R2
    maxAmount: 0,
    requiresDualApproval: false,
    requiredRoles: [],
    organizationId: "*",
    active: true,
  },
  {
    id: "policy-r2-single",
    name: "R2 — Single approval required",
    description: "Strict schema actions require single approver",
    minRiskLevel: "R2",
    maxAmount: 10000,
    requiresDualApproval: false,
    requiredRoles: ["accountant"],
    organizationId: "*",
    active: true,
  },
  {
    id: "policy-r3-dual",
    name: "R3 — Dual approval for high-risk actions",
    description: "Irreversible actions require dual approval",
    minRiskLevel: "R3",
    maxAmount: 10000,
    requiresDualApproval: false,
    requiredRoles: ["accountant"],
    organizationId: "*",
    active: true,
  },
  {
    id: "policy-r3-large-amount",
    name: "R3 — Large amount requires senior approval",
    description: "Actions over 10,000 require senior accountant approval",
    minRiskLevel: "R2",
    maxAmount: 0,
    currency: "PEN",
    requiresDualApproval: true,
    requiredRoles: ["senior-accountant"],
    organizationId: "*",
    active: true,
  },
];
