/**
 * FEOS-009 — Financial Impact Diff
 *
 * Enhanced accounting diff system for before/after comparison of financial state.
 * Extends the existing AccountingDiff entity with FEOS-level impact analysis,
 * risk scoring, evidence binding, and review queue integration.
 *
 * Properties:
 * - A diff represents a proposed change to financial state
 * - Impact analysis computes the financial effect of the change
 * - Risk scoring flags high-risk changes (large amounts, fiscal impact)
 * - Evidence binding links supporting evidence to each change
 * - Review queue integration provides workflow for approval
 *
 * @module @drenyra/domain/feos/diff
 */

import type { Actor, FiscalScope, Timestamp } from "./types";
import { FeosError, generateId, nowTimestamp } from "./types";
import type { EvidenceItem } from "./evidence-root";

// ============================================================================
// Diff Types
// ============================================================================

export type DiffCategory =
  | "journal_entry"
  | "invoice"
  | "reconciliation"
  | "sire_filing"
  | "account_balance"
  | "tax_calculation"
  | "configuration"
  | "other"
  ;

export type DiffSeverity =
  | "critical"   // Fiscal impact, regulatory reporting
  | "high"       // Material amount, downstream impact
  | "medium"     // Moderate amount, internal impact
  | "low"        // Minor adjustment, informational
  ;

export type DiffStatus =
  | "draft"
  | "ready_for_review"
  | "under_review"
  | "approved"
  | "rejected"
  | "applied"
  | "cancelled"
  ;

// ============================================================================
// Financial Impact
// ============================================================================

export interface FinancialImpact {
  /** Net monetary impact of the change. */
  netAmount: number;
  /** Currency of the amount. */
  currency: string;
  /** Debit total. */
  totalDebit: number;
  /** Credit total. */
  totalCredit: number;
  /** Whether the change affects fiscal reporting (SIRE, IGV, etc.). */
  affectsFiscalReporting: boolean;
  /** Whether the change affects cash flow. */
  affectsCashFlow: boolean;
  /** Whether the change affects the period close. */
  affectsPeriodClose: boolean;
  /** Accounts affected (account codes). */
  affectedAccounts: string[];
  /** Impact percentage relative to current balance (if available). */
  impactPercentage?: number;
  /** Human-readable impact summary. */
  summary: string;
}

// ============================================================================
// Diff Change — one atomic change within the diff
// ============================================================================

export interface DiffChange {
  id: string;
  field: string;
  before: unknown;
  after: unknown;
  label: string;
  /** Monetary impact of this single change. */
  amount?: number;
  /** Whether this change affects fiscal reporting. */
  fiscalImpact: boolean;
}

// ============================================================================
// Diff Review
// ============================================================================

export interface DiffReview {
  reviewedBy: Actor;
  reviewedAt: Timestamp;
  decision: "approved" | "rejected" | "changes_requested";
  comments: string;
  approvalRequestId?: string;
}

// ============================================================================
// Financial Diff Entity
// ============================================================================

export interface FinancialDiffProps {
  id: string;
  title: string;
  description: string;
  category: DiffCategory;
  severity: DiffSeverity;
  status: DiffStatus;
  /** The before state (serialized). */
  beforeState: unknown;
  /** The after state (serialized). */
  afterState: unknown;
  /** Individual changes. */
  changes: DiffChange[];
  /** Financial impact analysis. */
  impact: FinancialImpact;
  /** Evidence supporting the change. */
  evidence: EvidenceItem[];
  /** Review history. */
  reviews: DiffReview[];
  /** Related approval request ID. */
  approvalRequestId?: string;
  /** Fiscal scope. */
  scope: FiscalScope;
  /** Who created the diff. */
  createdBy: Actor;
  /** Workspace ID this diff belongs to. */
  workspaceId?: string | undefined;
  /** Trace ID for correlation. */
  traceId: string;
  /** Timestamps. */
  createdAt: Timestamp;
  updatedAt: Timestamp;
  appliedAt?: Timestamp | undefined;
  tags?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export class FinancialDiff {
  private constructor(private readonly props: FinancialDiffProps) {
    Object.freeze(this);
  }

  static create(input: {
    title: string;
    description: string;
    category: DiffCategory;
    beforeState: unknown;
    afterState: unknown;
    changes: DiffChange[];
    impact: FinancialImpact;
    scope: FiscalScope;
    createdBy: Actor;
    workspaceId?: string;
    traceId: string;
    evidence?: EvidenceItem[];
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): FinancialDiff {
    const severity = computeSeverity(input.impact);
    const now = nowTimestamp();

    return new FinancialDiff({
      id: generateId(),
      title: input.title,
      description: input.description,
      category: input.category,
      severity,
      status: "draft",
      beforeState: input.beforeState,
      afterState: input.afterState,
      changes: input.changes,
      impact: input.impact,
      evidence: input.evidence ?? [],
      reviews: [],
      scope: input.scope,
      createdBy: input.createdBy,
      workspaceId: input.workspaceId,
      traceId: input.traceId,
      createdAt: now,
      updatedAt: now,
      tags: input.tags,
      metadata: input.metadata,
    });
  }

  static fromProps(props: FinancialDiffProps): FinancialDiff {
    return new FinancialDiff(props);
  }

  // ─── Getters ────────────────────────────────────────────────────────────

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get status(): DiffStatus { return this.props.status; }
  get severity(): DiffSeverity { return this.props.severity; }
  get impact(): FinancialImpact { return this.props.impact; }
  get changes(): DiffChange[] { return this.props.changes; }
  get evidence(): EvidenceItem[] { return this.props.evidence; }
  get reviews(): DiffReview[] { return this.props.reviews; }
  get scope(): FiscalScope { return this.props.scope; }
  get approvalRequestId(): string | undefined { return this.props.approvalRequestId; }
  get isResolved(): boolean {
    return this.props.status === "approved"
      || this.props.status === "rejected"
      || this.props.status === "applied";
  }

  toProps(): FinancialDiffProps {
    return { ...this.props };
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  private transition(to: DiffStatus): FinancialDiff {
    if (!isValidDiffTransition(this.props.status, to)) {
      throw new FeosError(
        "INVALID_DIFF_TRANSITION",
        `Cannot transition from "${this.props.status}" to "${to}"`,
        { from: this.props.status, to },
      );
    }
    return new FinancialDiff({
      ...this.props,
      status: to,
      updatedAt: nowTimestamp(),
    });
  }

  submitForReview(): FinancialDiff {
    return this.transition("ready_for_review");
  }

  startReview(): FinancialDiff {
    return this.transition("under_review");
  }

  approve(review: DiffReview): FinancialDiff {
    const updated = this.transition("approved");
    return new FinancialDiff({
      ...updated.props,
      reviews: [...updated.props.reviews, review],
    });
  }

  reject(review: DiffReview): FinancialDiff {
    const updated = this.transition("rejected");
    return new FinancialDiff({
      ...updated.props,
      reviews: [...updated.props.reviews, review],
    });
  }

  markApplied(): FinancialDiff {
    return this.transition("applied");
  }

  cancel(): FinancialDiff {
    return this.transition("cancelled");
  }

  linkApproval(approvalRequestId: string): FinancialDiff {
    return new FinancialDiff({
      ...this.props,
      approvalRequestId,
      updatedAt: nowTimestamp(),
    });
  }

  addEvidence(item: EvidenceItem): FinancialDiff {
    return new FinancialDiff({
      ...this.props,
      evidence: [...this.props.evidence, item],
      updatedAt: nowTimestamp(),
    });
  }
}

// ============================================================================
// Valid transitions
// ============================================================================

const DIFF_TRANSITIONS: Record<DiffStatus, DiffStatus[]> = {
  draft: ["ready_for_review", "cancelled"],
  ready_for_review: ["under_review", "cancelled"],
  under_review: ["approved", "rejected", "cancelled"],
  approved: ["applied", "cancelled"],
  rejected: [],
  applied: [],
  cancelled: [],
};

export function isValidDiffTransition(from: DiffStatus, to: DiffStatus): boolean {
  return DIFF_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// Severity computation
// ============================================================================

export function computeSeverity(impact: FinancialImpact): DiffSeverity {
  if (impact.affectsFiscalReporting) return "critical";
  if (impact.affectsPeriodClose) return "high";
  if (impact.netAmount > 10000) return "high";
  if (impact.netAmount > 1000) return "medium";
  return "low";
}

// ============================================================================
// Risk scoring
// ============================================================================

export interface DiffRiskScore {
  overall: "low" | "medium" | "high" | "critical";
  factors: DiffRiskFactor[];
}

export interface DiffRiskFactor {
  name: string;
  score: number; // 0-10
  description: string;
}

export function computeDiffRiskScore(diff: FinancialDiffProps | FinancialDiff): DiffRiskScore {
  const props = diff instanceof FinancialDiff ? diff.toProps() : diff;
  const factors: DiffRiskFactor[] = [];

  // Monetary risk
  const amount = Math.abs(props.impact.netAmount);
  if (amount > 100000) {
    factors.push({ name: "large_amount", score: 10, description: `Amount ${amount} exceeds 100,000 threshold` });
  } else if (amount > 10000) {
    factors.push({ name: "moderate_amount", score: 6, description: `Amount ${amount} exceeds 10,000 threshold` });
  } else {
    factors.push({ name: "small_amount", score: 1, description: `Amount ${amount} is under 10,000` });
  }

  // Fiscal risk
  if (props.impact.affectsFiscalReporting) {
    factors.push({ name: "fiscal_impact", score: 10, description: "Change affects fiscal/SIRE reporting" });
  }

  // Period close risk
  if (props.impact.affectsPeriodClose) {
    factors.push({ name: "close_impact", score: 8, description: "Change affects period close" });
  }

  // Account risk (sensitive accounts)
  const sensitiveAccounts = ["10", "20", "40", "50"]; // Cash, AR, Taxes, Revenue
  const sensitiveHits = props.impact.affectedAccounts.filter((a) =>
    sensitiveAccounts.some((s) => a.startsWith(s)),
  ).length;
  if (sensitiveHits > 0) {
    factors.push({ name: "sensitive_accounts", score: Math.min(sensitiveHits * 2, 10), description: `${sensitiveHits} sensitive account(s) affected` });
  }

  // Average score
  const avg = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
  const overall = avg >= 8 ? "critical" as const : avg >= 5 ? "high" as const : avg >= 3 ? "medium" as const : "low" as const;

  return { overall, factors };
}

// ============================================================================
// Diff Store Interface
// ============================================================================

export interface FinancialDiffStore {
  store(diff: FinancialDiff): Promise<void>;
  get(id: string): Promise<FinancialDiff | null>;
  list(filter: DiffFilter): Promise<FinancialDiff[]>;
  listPending(): Promise<FinancialDiff[]>;
}

export interface DiffFilter {
  status?: DiffStatus;
  severity?: DiffSeverity;
  category?: DiffCategory;
  organizationId?: string;
  companyId?: string;
  workspaceId?: string;
  limit?: number;
  offset?: number;
}
