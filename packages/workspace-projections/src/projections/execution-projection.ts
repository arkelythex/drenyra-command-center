// ─── Execution Projection ───────────────────────────────────────────────────

import type { ExecutionId, OperationalState } from "@drenyra/workspace-domain";
import {
	createOperationalState,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	FRESHNESS_STATE,
} from "@drenyra/workspace-domain";
import type { DomainEvent } from "../store/types";

/**
 * Apply a single event to the current projected state.
 *
 * Pure function — returns a new OperationalState without mutation.
 */
export function applyEventToProjection(
	current: OperationalState,
	event: DomainEvent,
): OperationalState {
	const type = event.type;

	switch (type) {
		case "execution.started":
			return { ...current, lifecycle: LIFECYCLE_STATE.RUNNING };

		case "execution.completed":
			return { ...current, lifecycle: LIFECYCLE_STATE.COMPLETED };

		case "execution.failed":
			return { ...current, lifecycle: LIFECYCLE_STATE.FAILED };

		case "execution.cancelled":
			return { ...current, lifecycle: LIFECYCLE_STATE.CANCELLED };

		case "execution.attention.changed": {
			const attention = event.payload["attention"];
			if (typeof attention === "string" && isAttentionState(attention)) {
				return { ...current, attention };
			}
			return current;
		}

		case "execution.freshness.changed": {
			const freshness = event.payload["freshness"];
			if (typeof freshness === "string" && isFreshnessState(freshness)) {
				return { ...current, freshness };
			}
			return current;
		}

		default:
			return current;
	}
}

/**
 * Build the current OperationalState for an execution by replaying its events.
 */
export function buildExecutionProjection(
	executionId: ExecutionId,
	events: readonly DomainEvent[],
): { current: OperationalState; lastSequence: number } {
	const filtered = events
		.filter((e) => e.executionId === executionId)
		.sort((a, b) => a.sequence - b.sequence);

	let current = createOperationalState();
	let lastSequence = 0;

	for (const event of filtered) {
		current = applyEventToProjection(current, event);
		lastSequence = event.sequence;
	}

	return { current, lastSequence };
}

// ─── Type Narrowing Helpers ─────────────────────────────────────────────────

function isAttentionState(
	value: string,
): value is
	| "none"
	| "informational"
	| "input-required"
	| "evidence-required"
	| "approval-required"
	| "blocked"
	| "critical" {
	return Object.values(ATTENTION_STATE).includes(
		value as (typeof ATTENTION_STATE)[keyof typeof ATTENTION_STATE],
	);
}

function isFreshnessState(
	value: string,
): value is "live" | "delayed" | "stale" | "reconciling" | "disconnected" {
	return Object.values(FRESHNESS_STATE).includes(
		value as (typeof FRESHNESS_STATE)[keyof typeof FRESHNESS_STATE],
	);
}
