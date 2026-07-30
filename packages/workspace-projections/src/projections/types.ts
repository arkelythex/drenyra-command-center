// ─── Projection Types ───────────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";

/**
 * A projection is a read-only view derived from events.
 */
export interface Projection {
	readonly projectionId: string;
	readonly executionId: ExecutionId;
	readonly lastAppliedSequence: number;
	readonly lastCheckpointAt: string; // ISO 8601
}

/**
 * A checkpoint saves the projected state at a point in time.
 */
export interface Checkpoint {
	readonly projectionId: string;
	readonly executionId: ExecutionId;
	readonly sequence: number;
	readonly state: Record<string, unknown>;
	readonly timestamp: string; // ISO 8601
	readonly schemaVersion: number;
}
