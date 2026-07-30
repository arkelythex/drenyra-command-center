// ─── Rollup Reason Generator ─────────────────────────────────────────────────

import { ATTENTION_STATE } from "@drenyra/workspace-domain";
import type {
	RollupReason,
	ExecutionId,
	OperationalState,
	AttentionState,
} from "@drenyra/workspace-domain";

// ─── Severity ordering ──────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
	[ATTENTION_STATE.CRITICAL]: 0,
	[ATTENTION_STATE.BLOCKED]: 1,
	[ATTENTION_STATE.APPROVAL_REQUIRED]: 2,
	[ATTENTION_STATE.EVIDENCE_REQUIRED]: 3,
	[ATTENTION_STATE.INPUT_REQUIRED]: 4,
	[ATTENTION_STATE.INFORMATIONAL]: 5,
	[ATTENTION_STATE.NONE]: 6,
};

// ─── Reason templates ───────────────────────────────────────────────────────

function reasonMessage(severity: AttentionState, count: number): string {
	switch (severity) {
		case ATTENTION_STATE.CRITICAL:
			return `${count} critical issues require immediate attention`;
		case ATTENTION_STATE.BLOCKED:
			return `${count} executions blocked`;
		case ATTENTION_STATE.APPROVAL_REQUIRED:
			return `${count} approvals pending`;
		case ATTENTION_STATE.EVIDENCE_REQUIRED:
			return `${count} evidence documents required`;
		case ATTENTION_STATE.INPUT_REQUIRED:
			return `${count} inputs required`;
		case ATTENTION_STATE.INFORMATIONAL:
			return `${count} informational notices`;
		default:
			return "";
	}
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function generateRollupReasons(
	states: ReadonlyMap<ExecutionId, OperationalState>,
): RollupReason[] {
	if (states.size === 0) {
		return [];
	}

	// Count by severity
	const countBySeverity = new Map<AttentionState, number>();

	for (const state of states.values()) {
		const severity = state.attention;
		// Skip NONE — not a reason-worthy state
		if (severity === ATTENTION_STATE.NONE) continue;

		countBySeverity.set(severity, (countBySeverity.get(severity) ?? 0) + 1);
	}

	// Build reasons
	const reasons: RollupReason[] = [];
	for (const [severity, count] of countBySeverity) {
		const message = reasonMessage(severity, count);
		if (message === "") continue;

		reasons.push({
			severity,
			message,
			affectedCount: count,
		});
	}

	// Sort by severity (critical first)
	reasons.sort(
		(a, b) =>
			(SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99),
	);

	return reasons;
}
