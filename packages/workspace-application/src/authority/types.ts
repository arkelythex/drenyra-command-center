import type { ExecutionId, OperationalState } from "@drenyra/workspace-domain";

// ─── Authority Level ─────────────────────────────────────────────────────────

export const AUTHORITY_LEVEL = {
	OBSERVED: "observed",
	REPORTED: "reported",
	AUTHORITATIVE: "authoritative",
} as const;

export type AuthorityLevel =
	(typeof AUTHORITY_LEVEL)[keyof typeof AUTHORITY_LEVEL];

// ─── State Source ────────────────────────────────────────────────────────────

export const STATE_SOURCE = {
	PI: "pi",
	WORKFLOW: "workflow",
	APPROVAL_CONTROL_PLANE: "approval-control-plane",
	CONNECTOR: "connector",
	RECONCILER: "reconciler",
	SYSTEM: "system",
} as const;

export type StateSource = (typeof STATE_SOURCE)[keyof typeof STATE_SOURCE];

// ─── Authoritative State Record ──────────────────────────────────────────────

export interface AuthoritativeStateRecord {
	readonly executionId: ExecutionId;
	readonly state: OperationalState;
	readonly authority: AuthorityLevel;
	readonly source: StateSource;
	readonly sequence: number;
	readonly observedAt: string; // ISO 8601
	readonly effectiveAt: string; // ISO 8601
	readonly schemaVersion: number;
}

// ─── Authority Precedence Result ─────────────────────────────────────────────

export interface AuthorityPrecedenceResult {
	readonly apply: boolean;
	readonly reason: string;
}

// ─── State Event ─────────────────────────────────────────────────────────────

export interface StateEvent {
	readonly executionId: ExecutionId;
	readonly newState: OperationalState;
	readonly authority: AuthorityLevel;
	readonly source: StateSource;
	readonly sequence: number;
	readonly observedAt: string;
	readonly effectiveAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const CURRENT_AUTHORITY_SCHEMA_VERSION = 1;
