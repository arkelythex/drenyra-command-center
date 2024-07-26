/**
 * FEOS-005 — Exact Candidate Review Authority
 *
 * The core trust mechanism: a professional does not approve an intention,
 * they approve an EXACT financial candidate. The candidate is frozen,
 * hashed, reviewed, receipted, and revalidated before execution.
 *
 * Protocol:
 * 1. Create Candidate — freeze the proposed action + evidence
 * 2. Freeze — compute candidate hash, lock all inputs
 * 3. Review — professional reviews the frozen candidate
 * 4. Receipt — immutable receipt of the review decision
 * 5. Revalidate — before execution, recompute hash and verify
 * 6. Execute — only if revalidation passes
 *
 * @module @drenyra/domain/feos/candidate-review
 */

import type { Actor, FiscalScope, Timestamp } from "./types";
import { FeosError, generateId, nowTimestamp } from "./types";
import type { ToolRiskLevel } from "./tool-contract";
import { createHash } from "node:crypto";

// ============================================================================
// Candidate Status
// ============================================================================

export type CandidateStatus =
  | "draft"
  | "frozen"
  | "under_review"
  | "approved"
  | "rejected"
  | "executed"
  | "invalidated"
  ;

// ============================================================================
// Review Decision
// ============================================================================

export interface CandidateReview {
  reviewer: Actor;
  decision: "approved" | "rejected" | "changes_requested";
  comments: string;
  reviewedAt: Timestamp;
  evidenceRootId?: string;
}

// ============================================================================
// Exact Candidate
// ============================================================================

export interface CandidateProps {
  id: string;
  title: string;
  description: string;
  /** The exact proposed action input (frozen at freeze time). */
  actionInput: unknown;
  /** The proposed action type. */
  action: string;
  /** Risk level. */
  riskLevel: ToolRiskLevel;
  /** Current status. */
  status: CandidateStatus;
  /** SHA-256 of the frozen action input + evidence root. */
  candidateHash: string;
  /** Evidence root supporting the candidate. */
  evidenceRootHash?: string;
  /** Review history. */
  reviews: CandidateReview[];
  /** Fiscal scope. */
  scope: FiscalScope;
  /** Who created the candidate. */
  createdBy: Actor;
  /** Trace ID. */
  traceId: string;
  /** Approval request ID if routed through approval. */
  approvalRequestId?: string;
  /** Policy version that was applied for review. */
  policyVersion?: string;
  /** Validation result before execution. */
  lastValidationResult?: "passed" | "failed" | "not_run";
  /** Timestamps. */
  createdAt: Timestamp;
  frozenAt?: Timestamp;
  reviewedAt?: Timestamp;
  executedAt?: Timestamp;
  invalidatedAt?: Timestamp;
}

/**
 * Compute the candidate hash — SHA-256 of action + input + evidence.
 */
export function computeCandidateHash(action: string, input: unknown, evidenceRootHash?: string): string {
  const payload = JSON.stringify({ action, input, evidenceRootHash });
  return createHash("sha256").update(payload).digest("hex");
}

export class ExactCandidate {
  private constructor(private readonly props: CandidateProps) {
    Object.freeze(this);
  }

  static create(input: {
    title: string;
    description: string;
    action: string;
    actionInput: unknown;
    riskLevel: ToolRiskLevel;
    scope: FiscalScope;
    createdBy: Actor;
    traceId: string;
    evidenceRootHash?: string;
  }): ExactCandidate {
    const hash = computeCandidateHash(input.action, input.actionInput, input.evidenceRootHash);
    return new ExactCandidate({
      id: generateId(),
      title: input.title,
      description: input.description,
      action: input.action,
      actionInput: input.actionInput,
      riskLevel: input.riskLevel,
      status: "draft",
      candidateHash: hash,
      evidenceRootHash: input.evidenceRootHash,
      reviews: [],
      scope: input.scope,
      createdBy: input.createdBy,
      traceId: input.traceId,
      createdAt: nowTimestamp(),
      lastValidationResult: "not_run",
    });
  }

  static fromProps(props: CandidateProps): ExactCandidate {
    return new ExactCandidate(props);
  }

  get id(): string { return this.props.id; }
  get status(): CandidateStatus { return this.props.status; }
  get candidateHash(): string { return this.props.candidateHash; }
  get reviews(): CandidateReview[] { return this.props.reviews; }
  get action(): string { return this.props.action; }
  get actionInput(): unknown { return this.props.actionInput; }

  /**
   * Freeze the candidate — locks the hash and moves to reviewable state.
   */
  freeze(): ExactCandidate {
    if (this.props.status !== "draft") {
      throw new FeosError("CANDIDATE_NOT_DRAFT", `Cannot freeze candidate in "${this.props.status}" state`);
    }
    const hash = computeCandidateHash(this.props.action, this.props.actionInput, this.props.evidenceRootHash);
    return new ExactCandidate({
      ...this.props,
      status: "frozen",
      candidateHash: hash,
      frozenAt: nowTimestamp(),
    });
  }

  /**
   * Submit for review.
   */
  submitForReview(): ExactCandidate {
    if (this.props.status !== "frozen") {
      throw new FeosError("CANDIDATE_NOT_FROZEN", `Cannot submit for review: status is "${this.props.status}"`);
    }
    return new ExactCandidate({ ...this.props, status: "under_review" });
  }

  /**
   * Record a review decision.
   */
  review(decision: CandidateReview): ExactCandidate {
    if (this.props.status !== "under_review") {
      throw new FeosError("CANDIDATE_NOT_UNDER_REVIEW", `Cannot review: status is "${this.props.status}"`);
    }
    const now = nowTimestamp();
    return new ExactCandidate({
      ...this.props,
      status: decision.decision === "approved" ? "approved" : "rejected",
      reviews: [...this.props.reviews, decision],
      reviewedAt: now,
      policyVersion: "1.0.0",
    });
  }

  /**
   * Revalidate before execution — recomputes hash and compares.
   * If anything changed (input, evidence), the hash won't match → invalidated.
   */
  revalidate(input?: unknown, evidenceRootHash?: string): { passed: boolean; hash: string } {
    const checkInput = input ?? this.props.actionInput;
    const hash = computeCandidateHash(this.props.action, checkInput, evidenceRootHash ?? this.props.evidenceRootHash);
    const passed = hash === this.props.candidateHash;

    return { passed, hash };
  }

  /**
   * Execute the candidate — only if approved and revalidation passes.
   */
  execute(input?: unknown, evidenceRootHash?: string): ExactCandidate {
    if (this.props.status !== "approved") {
      throw new FeosError(
        "CANDIDATE_NOT_APPROVED",
        `Cannot execute: status is "${this.props.status}"`,
      );
    }

    const validation = this.revalidate(input, evidenceRootHash);
    if (!validation.passed) {
      // Candidate was tampered with — invalidate
      return new ExactCandidate({
        ...this.props,
        status: "invalidated",
        lastValidationResult: "failed",
        invalidatedAt: nowTimestamp(),
      });
    }

    return new ExactCandidate({
      ...this.props,
      status: "executed",
      lastValidationResult: "passed",
      executedAt: nowTimestamp(),
    });
  }

  /**
   * Invalidate the candidate (e.g. scope changed, policy updated).
   */
  invalidate(): ExactCandidate {
    return new ExactCandidate({
      ...this.props,
      status: "invalidated",
      lastValidationResult: "failed",
      invalidatedAt: nowTimestamp(),
    });
  }

  toProps(): CandidateProps {
    return { ...this.props };
  }
}
