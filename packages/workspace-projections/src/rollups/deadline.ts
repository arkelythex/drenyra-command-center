// ─── Deadline Propagator ─────────────────────────────────────────────────────

import type { AttentionRollup } from "@drenyra/workspace-domain";
import type { ExecutionDeadline } from "./types";

// ─── findNearestDeadline ────────────────────────────────────────────────────

export function findNearestDeadline(
	deadlines: readonly ExecutionDeadline[],
): ExecutionDeadline | null {
	if (deadlines.length === 0) {
		return null;
	}

	let nearest: ExecutionDeadline | null = null;

	for (const current of deadlines) {
		if (nearest === null || current.deadline < nearest.deadline) {
			nearest = current;
		}
	}

	return nearest;
}

// ─── propagateDeadline ──────────────────────────────────────────────────────

export function propagateDeadline(
	rollups: readonly AttentionRollup[],
): string | undefined {
	let earliest: string | undefined;

	for (const rollup of rollups) {
		const dl = rollup.nearestDeadline;
		if (dl === undefined) continue;

		if (earliest === undefined || dl < earliest) {
			earliest = dl;
		}
	}

	return earliest;
}
