/**
 * Cognitive Stream — Activity timeline helpers.
 *
 * Extracted from cognitive-stream.ts for maintainability.
 */

import type { AgentEvent } from "@drenyra/shared";
import type {
	CognitiveActivityEntry,
	ApprovalStateRecord,
	CognitiveActivityStatus,
} from "./cognitive-stream-types";

const DEFAULT_ACTIVITY_LIMIT = 80;

// ──────────────────────────────────────
// Activity timeline
// ──────────────────────────────────────

function nowIsoString(): string {
	return new Date().toISOString();
}

export function resolveEventRunId(
	event: AgentEvent,
	fallback: string | null,
): string | null {
	if (event.runId) return event.runId;
	if (event.type === "approval_required") return event.payload.approvalId;
	if (event.type === "approval_decision") return event.payload.approvalId;
	return fallback;
}

export function createActivityEntry(
	event: AgentEvent,
	runId: string | null,
): CognitiveActivityEntry | null {
	const timestamp = nowIsoString();

	switch (event.type) {
		case "run_started":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "run_started",
				label: "Run iniciado",
				detail: null,
				status: "info" as CognitiveActivityStatus,
				timestamp,
			};
		case "tool_call":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "tool_call",
				label: "Tool call iniciado",
				detail: event.payload.toolName,
				status: "info" as CognitiveActivityStatus,
				timestamp,
			};
		case "tool_result":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "tool_result",
				label: "Tool completado",
				detail: event.payload.toolName,
				status: "success" as CognitiveActivityStatus,
				timestamp,
			};
		case "tool_error":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "tool_error",
				label: "Tool error",
				detail: `${event.payload.toolName}: ${event.payload.error}`,
				status: "error" as CognitiveActivityStatus,
				timestamp,
			};
		case "approval_required":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "approval_required",
				label: "Aprobación requerida",
				detail: event.payload.toolName,
				status: "warning" as CognitiveActivityStatus,
				timestamp,
			};
		case "approval_decision":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "approval_decision",
				label: event.payload.decision === "approved"
					? "Aprobación aceptada"
					: "Aprobación rechazada",
				detail: event.payload.reason ?? null,
				status: event.payload.decision === "approved"
					? ("success" as CognitiveActivityStatus)
					: ("warning" as CognitiveActivityStatus),
				timestamp,
			};
		case "complete":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "complete",
				label: "Run finalizado",
				detail: null,
				status: "success" as CognitiveActivityStatus,
				timestamp,
			};
		case "error":
			return {
				id: crypto.randomUUID(),
				runId,
				type: "error",
				label: "Error",
				detail: event.payload.message,
				status: "error" as CognitiveActivityStatus,
				timestamp,
			};
		case "thinking":
		case "usage":
		case "progress":
			return null;
		default:
			return null;
	}
}

export function appendActivityEntry(
	previous: CognitiveActivityEntry[],
	nextEntry: CognitiveActivityEntry | null,
	limit = DEFAULT_ACTIVITY_LIMIT,
): CognitiveActivityEntry[] {
	if (!nextEntry) return previous;
	const next = [...previous, nextEntry];
	if (next.length <= limit) return next;
	return next.slice(next.length - limit);
}

function statusToActivity(record: ApprovalStateRecord): CognitiveActivityEntry {
	if (record.status === "pending") {
		return {
			id: `persisted-${record.toolCallId}-pending-${record.requestedAt}`,
			runId: record.runId,
			type: "approval_required",
			label: "Aprobacion pendiente",
			detail: record.name,
			status: "warning" as CognitiveActivityStatus,
			timestamp: record.requestedAt,
		};
	}

	if (record.status === "approved") {
		return {
			id: `persisted-${record.toolCallId}-approved-${record.decidedAt ?? record.requestedAt}`,
			runId: record.runId,
			type: "approval_decision",
			label: "Aprobacion aceptada",
			detail: record.decisionReason
				? `${record.name}: ${record.decisionReason}`
				: record.name,
			status: "success" as CognitiveActivityStatus,
			timestamp: record.decidedAt ?? record.requestedAt,
		};
	}

	if (record.status === "rejected") {
		return {
			id: `persisted-${record.toolCallId}-rejected-${record.decidedAt ?? record.requestedAt}`,
			runId: record.runId,
			type: "approval_decision",
			label: "Aprobacion rechazada",
			detail: record.decisionReason
				? `${record.name}: ${record.decisionReason}`
				: record.name,
			status: "warning" as CognitiveActivityStatus,
			timestamp: record.decidedAt ?? record.requestedAt,
		};
	}

	return {
		id: `persisted-${record.toolCallId}-expired-${record.decidedAt ?? record.requestedAt}`,
		runId: record.runId,
		type: "approval_decision",
		label: "Aprobacion expirada",
		detail: record.decisionReason
			? `${record.name}: ${record.decisionReason}`
			: record.name,
		status: "error" as CognitiveActivityStatus,
		timestamp: record.decidedAt ?? record.requestedAt,
	};
}

export function mergeRecoveredActivities(
	current: CognitiveActivityEntry[],
	records: ApprovalStateRecord[],
	limit = DEFAULT_ACTIVITY_LIMIT,
): CognitiveActivityEntry[] {
	if (records.length === 0) return current;
	const recovered = records.map(statusToActivity);
	const byId = new Map<string, CognitiveActivityEntry>();

	for (const entry of [...current, ...recovered]) {
		byId.set(entry.id, entry);
	}

	const merged = Array.from(byId.values()).sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);

	if (merged.length <= limit) return merged;
	return merged.slice(merged.length - limit);
}
