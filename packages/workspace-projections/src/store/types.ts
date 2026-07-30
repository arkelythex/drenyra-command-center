// ─── Domain Event ────────────────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";
import type {
	AuthorityLevel,
	StateSource,
} from "@drenyra/workspace-application";

/**
 * Domain event — the atomic unit of state change in the append-only log.
 */
export interface DomainEvent {
	readonly eventId: string;
	readonly executionId: ExecutionId;
	readonly sequence: number;
	readonly type: string;
	readonly payload: Record<string, unknown>;
	readonly authority: AuthorityLevel;
	readonly source: StateSource;
	readonly timestamp: string; // ISO 8601
	readonly schemaVersion: number;
}

// ─── Current Schema Version ─────────────────────────────────────────────────

export const CURRENT_EVENT_SCHEMA_VERSION = 1;
