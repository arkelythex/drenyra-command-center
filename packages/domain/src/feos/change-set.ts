/**
 * FEOS-004 — Financial Change Sets
 *
 * A Change Set is an isolated bundle of proposed financial changes,
 * analogous to a Git branch or Herdr worktree. It groups journal entries,
 * document changes, and SIRE adjustments for coordinated review and approval.
 *
 * Principles:
 * - A Change Set is the unit of review, approval, and execution
 * - Changes are isolated until the Change Set is applied
 * - Each Change Set has a clear before/after diff
 * - Change Sets can be branched, merged, and rolled back
 *
 * @module @drenyra/domain/feos/change-set
 */

import type { Actor, FiscalScope, Timestamp } from "./types";
import { FeosError, generateId, nowTimestamp } from "./types";

// ============================================================================
// Change Set Status
// ============================================================================

export const CHANGE_SET_STATUS = {
  DRAFT: "draft",
  PROPOSED: "proposed",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  APPLIED: "applied",
  REJECTED: "rejected",
  ROLLED_BACK: "rolled_back",
  CANCELLED: "cancelled",
} as const;

export type ChangeSetStatus = (typeof CHANGE_SET_STATUS)[keyof typeof CHANGE_SET_STATUS];

// ============================================================================
// Change Entry — one atomic change within the set
// ============================================================================

export type ChangeEntryType =
  | "journal_entry"
  | "invoice_adjustment"
  | "document_attachment"
  | "sire_adjustment"
  | "account_configuration"
  | "reconciliation"
  ;

export interface ChangeEntry {
  id: string;
  type: ChangeEntryType;
  description: string;
  beforeState: unknown;
  afterState: unknown;
  fiscalImpact: boolean;
  amount?: number;
  currency?: string;
}

// ============================================================================
// Change Set Entity
// ============================================================================

export interface ChangeSetProps {
  id: string;
  title: string;
  description: string;
  workspaceId: string;
  status: ChangeSetStatus;
  entries: ChangeEntry[];
  parentId?: string | undefined;      // For branching
  childIds: string[];     // For merge tracking
  evidenceRootId?: string | undefined;
  scope: FiscalScope;
  createdBy: Actor;
  traceId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  appliedAt?: Timestamp | undefined;
  rolledBackAt?: Timestamp | undefined;
  tags?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export class ChangeSet {
  private constructor(private readonly props: ChangeSetProps) {
    Object.freeze(this);
  }

  static create(input: {
    title: string;
    description: string;
    workspaceId: string;
    scope: FiscalScope;
    createdBy: Actor;
    traceId: string;
    parentId?: string;
    entries?: ChangeEntry[];
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): ChangeSet {
    return new ChangeSet({
      id: generateId(),
      title: input.title,
      description: input.description,
      workspaceId: input.workspaceId,
      status: "draft",
      entries: input.entries ?? [],
      parentId: input.parentId,
      childIds: [],
      scope: input.scope,
      createdBy: input.createdBy,
      traceId: input.traceId,
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
      tags: input.tags,
      metadata: input.metadata,
    });
  }

  static fromProps(props: ChangeSetProps): ChangeSet {
    return new ChangeSet(props);
  }

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get status(): ChangeSetStatus { return this.props.status; }
  get entries(): ChangeEntry[] { return this.props.entries; }
  get parentId(): string | undefined { return this.props.parentId; }
  get childIds(): string[] { return this.props.childIds; }

  private transition(to: ChangeSetStatus): ChangeSet {
    if (!isValidCSTransition(this.props.status, to)) {
      throw new FeosError(
        "INVALID_CHANGESET_TRANSITION",
        `Cannot transition from "${this.props.status}" to "${to}"`,
      );
    }
    const now = nowTimestamp();
    return new ChangeSet({
      ...this.props,
      status: to,
      updatedAt: now,
      appliedAt: to === "applied" ? now : this.props.appliedAt,
      rolledBackAt: to === "rolled_back" ? now : this.props.rolledBackAt,
    });
  }

  propose(): ChangeSet { return this.transition("proposed"); }
  submitForReview(): ChangeSet { return this.transition("under_review"); }
  approve(): ChangeSet { return this.transition("approved"); }
  reject(): ChangeSet { return this.transition("rejected"); }
  apply(): ChangeSet { return this.transition("applied"); }
  rollback(): ChangeSet { return this.transition("rolled_back"); }
  cancel(): ChangeSet { return this.transition("cancelled"); }

  addEntry(entry: ChangeEntry): ChangeSet {
    return new ChangeSet({ ...this.props, entries: [...this.props.entries, entry], updatedAt: nowTimestamp() });
  }

  /** Fork this Change Set — creates a child branch. */
  fork(title: string, description: string, actor: Actor): ChangeSet {
    const child = new ChangeSet({
      ...this.props,
      id: generateId(),
      title,
      description,
      status: "draft",
      parentId: this.props.id,
      childIds: [],
      createdBy: actor,
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
      entries: [...this.props.entries],
    });

    // Register the child in this parent
    this.props.childIds.push(child.id);

    return child;
  }

  /** Merge a child Change Set into this one. */
  merge(child: ChangeSet): ChangeSet {
    if (child.parentId !== this.props.id) {
      throw new FeosError("NOT_A_CHILD", `ChangeSet "${child.id}" is not a child of "${this.props.id}"`);
    }
    if (child.status !== "approved") {
      throw new FeosError("CHILD_NOT_APPROVED", `Child ChangeSet "${child.id}" must be approved before merge`);
    }

    return new ChangeSet({
      ...this.props,
      entries: [...this.props.entries, ...child.entries],
      updatedAt: nowTimestamp(),
    });
  }

  linkEvidence(evidenceRootId: string): ChangeSet {
    return new ChangeSet({ ...this.props, evidenceRootId, updatedAt: nowTimestamp() });
  }

  toProps(): ChangeSetProps {
    return { ...this.props };
  }
}

// ============================================================================
// Valid Transitions
// ============================================================================

const CS_TRANSITIONS: Record<ChangeSetStatus, ChangeSetStatus[]> = {
  draft: ["proposed", "cancelled"],
  proposed: ["under_review", "cancelled"],
  under_review: ["approved", "rejected", "cancelled"],
  approved: ["applied", "cancelled"],
  applied: ["rolled_back"],
  rejected: [],
  rolled_back: [],
  cancelled: [],
};

export function isValidCSTransition(from: ChangeSetStatus, to: ChangeSetStatus): boolean {
  return CS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// Change Set Store Interface
// ============================================================================

export interface ChangeSetStore {
  store(cs: ChangeSet): Promise<void>;
  get(id: string): Promise<ChangeSet | null>;
  list(filter?: { workspaceId?: string; status?: ChangeSetStatus }): Promise<ChangeSet[]>;
}
