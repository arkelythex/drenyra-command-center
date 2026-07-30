import { createOperationalState } from "@drenyra/workspace-domain";
import type { OperationalState } from "@drenyra/workspace-domain";
import { shouldApplyState } from "./precedence";
import {
	AUTHORITY_LEVEL,
	CURRENT_AUTHORITY_SCHEMA_VERSION,
	type AuthoritativeStateRecord,
	type StateEvent,
} from "./types";

// ─── Reduce Execution State ──────────────────────────────────────────────────

/**
 * Pure reducer that processes a StateEvent against the current set of records.
 *
 * Logic:
 * 1. Check if event is duplicate (same executionId + sequence already in records)
 * 2. If duplicate → return unchanged
 * 3. Find the latest authoritative record for this executionId
 * 4. Apply precedence rules via shouldApplyState
 * 5. If accepted → append to records, recompute current OperationalState
 * 6. If rejected → return unchanged
 */
export function reduceExecutionState(
	records: readonly AuthoritativeStateRecord[],
	event: StateEvent,
): { records: readonly AuthoritativeStateRecord[]; current: OperationalState } {
	// Check for duplicate: same executionId + sequence already exists
	const duplicate = records.some(
		(r) => r.executionId === event.executionId && r.sequence === event.sequence,
	);
	if (duplicate) {
		return {
			records,
			current: resolveCurrentState(records),
		};
	}

	// Find the latest authoritative record for this executionId
	const executionRecords = records
		.filter((r) => r.executionId === event.executionId)
		.sort((a, b) => b.sequence - a.sequence);

	const latestExisting = executionRecords[0] ?? null;

	// Convert event to a tentative record for precedence comparison
	const incomingRecord: AuthoritativeStateRecord = {
		executionId: event.executionId,
		state: event.newState,
		authority: event.authority,
		source: event.source,
		sequence: event.sequence,
		observedAt: event.observedAt,
		effectiveAt: event.effectiveAt,
		schemaVersion: CURRENT_AUTHORITY_SCHEMA_VERSION,
	};

	// If no existing record for this executionId, auto-accept
	if (!latestExisting) {
		const newRecords = [...records, incomingRecord];
		return {
			records: newRecords,
			current: resolveCurrentState(newRecords),
		};
	}

	// Apply precedence rules
	const result = shouldApplyState(latestExisting, incomingRecord);

	if (result.apply) {
		const newRecords = [...records, incomingRecord];
		return {
			records: newRecords,
			current: resolveCurrentState(newRecords),
		};
	}

	// Rejected: return unchanged
	return {
		records,
		current: resolveCurrentState(records),
	};
}

// ─── Resolve Current State ───────────────────────────────────────────────────

function resolveCurrentState(
	records: readonly AuthoritativeStateRecord[],
): OperationalState {
	if (records.length === 0) {
		return createOperationalState();
	}

	// Get the most recent authoritative record: highest authority, highest sequence
	const sorted = [...records].sort((a, b) => {
		const rankA = authorityRank(a.authority);
		const rankB = authorityRank(b.authority);
		if (rankA !== rankB) return rankB - rankA;
		return b.sequence - a.sequence;
	});
	const best = sorted[0];
	if (!best) {
		return createOperationalState();
	}

	return best.state;
}

function authorityRank(authority: string): number {
	if (authority === AUTHORITY_LEVEL.AUTHORITATIVE) return 3;
	if (authority === AUTHORITY_LEVEL.REPORTED) return 2;
	return 1;
}
