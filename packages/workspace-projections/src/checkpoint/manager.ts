// ─── Checkpoint Manager ─────────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";
import type { Checkpoint } from "../projections/types";

// ─── Checkpoint Store Interface ──────────────────────────────────────────────

export interface CheckpointStore {
	save(checkpoint: Checkpoint): void;
	getLatest(projectionId: string, executionId: ExecutionId): Checkpoint | null;
	getAll(projectionId: string, executionId: ExecutionId): readonly Checkpoint[];
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createCheckpoint(
	projectionId: string,
	executionId: ExecutionId,
	sequence: number,
	state: Record<string, unknown>,
): Checkpoint {
	return {
		projectionId,
		executionId,
		sequence,
		state,
		timestamp: new Date().toISOString(),
		schemaVersion: 1,
	};
}

// ─── Heuristic ──────────────────────────────────────────────────────────────

/**
 * Returns true if a checkpoint should be created.
 *
 * Criteria:
 * - No previous checkpoint (null) → always create
 * - Current sequence is at or past (lastCheckpoint.sequence + checkpointInterval)
 */
export function shouldCreateCheckpoint(
	lastCheckpoint: Checkpoint | null,
	currentSequence: number,
	checkpointInterval: number,
): boolean {
	if (!lastCheckpoint) {
		return true;
	}

	return currentSequence >= lastCheckpoint.sequence + checkpointInterval;
}
