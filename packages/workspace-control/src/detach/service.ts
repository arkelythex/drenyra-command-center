import {
	FRESHNESS_STATE,
} from "@drenyra/workspace-domain";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
} from "@drenyra/workspace-application";
import type { EventStore } from "@drenyra/workspace-projections";
import { CURRENT_EVENT_SCHEMA_VERSION } from "@drenyra/workspace-projections";
import type { DetachRequest, DetachResult } from "./types";
import { DetachError } from "../attach/errors";

// ─── Detach Service ─────────────────────────────────────────────────────────

/**
 * Detach from an execution.
 *
 * Logic:
 * 1. Validate executionId exists (has events in store).
 * 2. If execution exists → append a "client.detached" event marking the disconnection.
 * 3. Execution freshness is set to DISCONNECTED in the result.
 * 4. executionContinues is ALWAYS true — detach NEVER cancels.
 * 5. If execution doesn't exist → throw DetachError.
 */
export function detachFromExecution(
	request: DetachRequest,
	store: EventStore,
): DetachResult {
	const { executionId, clientId, reason } = request;

	// Validate executionId exists (has events)
	const latestSequence = store.getLatestSequence(executionId);
	if (latestSequence === 0) {
		throw new DetachError(
			`Cannot detach from non-existent execution: ${executionId}`,
		);
	}

	// Append detach event
	const nextSequence = latestSequence + 1;
	const payload: Record<string, unknown> = {
		detachedAt: new Date().toISOString(),
		freshness: FRESHNESS_STATE.DISCONNECTED,
	};
	if (clientId !== undefined) {
		payload["clientId"] = clientId;
	}
	if (reason !== undefined) {
		payload["reason"] = reason;
	}

	store.append({
		eventId: crypto.randomUUID(),
		executionId,
		sequence: nextSequence,
		type: "client.detached",
		payload,
		authority: AUTHORITY_LEVEL.OBSERVED,
		source: STATE_SOURCE.SYSTEM,
		timestamp: new Date().toISOString(),
		schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
	});

	return {
		executionId,
		detachedAt: new Date().toISOString(),
		executionContinues: true as const,
		freshness: FRESHNESS_STATE.DISCONNECTED,
	};
}

/**
 * Safe version — catches DetachError for missing executions.
 */
export function detachFromExecutionSafe(
	request: DetachRequest,
	store: EventStore,
):
	| { ok: true; result: DetachResult }
	| { ok: false; error: string } {
	try {
		const result = detachFromExecution(request, store);
		return { ok: true, result };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Unknown detach error";
		return { ok: false, error: message };
	}
}
