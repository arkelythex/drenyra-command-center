import type { AgentEvent } from "@drenyra/shared";
/**
 * Cognitive Stream — barrel module.
 *
 * Aggregates types, SSE parsing, activity timeline, storage, transport,
 * and state reducer from the extracted sub-modules.
 */

import { runtimeConfig } from "@/lib/runtime-config";
import { ACTIVE_COMPANY_STORAGE_KEY } from "@/lib/company-context";
import { ACTIVE_FISCAL_PERIOD_STORAGE_KEY } from "@/lib/fiscal-period";

// Re-export types
export type {
	Message,
	ModelTier,
	PendingToolApproval,
	StreamState,
	StreamUsage,
	RunStateRecord,
	RunStateResponse,
	ControlPlaneRunSnapshot,
	CognitiveActivityStatus,
	CognitiveActivityEntry,
	ApprovalStateRecord,
} from "./cognitive-stream-types";

// Re-export SSE parser + event normalizer
export {
	consumeSseBuffer,
	normalizeRawToAgentEvent,
	parseSseEventChunks,
	parseTypedSseEvent,
} from "./cognitive-stream-sse";
export type { SseEventChunk } from "./cognitive-stream-sse";

// Re-export activity timeline
export {
	createActivityEntry,
	appendActivityEntry,
	mergeRecoveredActivities,
	resolveEventRunId,
} from "./cognitive-stream-activities";

// Re-export storage
export {
	readPersistedRunId,
	writePersistedRunId,
	readPersistedTimeline,
	writePersistedTimeline,
	clearPersistedTimeline,
} from "./cognitive-stream-storage";

// ──────────────────────────────────────
// Transport
// ──────────────────────────────────────

const API_BASE_URL = runtimeConfig.apiUrl;

export function buildCognitiveApiUrl(path: string, baseUrl?: string): string {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const rawBase = (baseUrl ?? API_BASE_URL).trim();
	const normalizedBase = rawBase.replace(/\/+$/, "");
	return `${normalizedBase}${normalizedPath}`;
}

export function buildCognitiveHeaders(organizationId: string): HeadersInit {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (organizationId.trim()) {
		headers["x-organization-id"] = organizationId.trim();
	}
	// Inyectar contexto fiscal global desde las keys canónicas
	try {
		const companyRaw = localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
		const period = localStorage.getItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY);
		if (companyRaw) {
			const company = JSON.parse(companyRaw) as {
				ruc?: string;
				companyId?: string;
			};
			if (company.ruc) headers["x-company-ruc"] = company.ruc;
			if (company.companyId) headers["x-company-id"] = company.companyId;
		}
		if (period) headers["x-fiscal-period"] = period;
	} catch {
		// localStorage unavailable or corrupted — continue without context
	}
	return headers;
}

// ──────────────────────────────────────
// State reducer
// ──────────────────────────────────────

import {
	resolveEventRunId,
	createActivityEntry,
	appendActivityEntry,
} from "./cognitive-stream-activities";
import { writePersistedRunId } from "./cognitive-stream-storage";
import type { StreamState } from "./cognitive-stream-types";

export function reduceToolEventState(
	prev: StreamState,
	event: AgentEvent,
): StreamState {
	const nextRunId = resolveEventRunId(event, prev.runId);
	const activityEntry = createActivityEntry(event, nextRunId);

	const nextState: StreamState = {
		...prev,
		runId: nextRunId,
		activityTimeline: appendActivityEntry(prev.activityTimeline, activityEntry),
	};

	if (event.type === "run_started") {
		writePersistedRunId(event.payload.runId);
	}

	if (event.type === "thinking") {
		nextState.currentMessage = `${prev.currentMessage}${event.payload.content}`;
	}

	if (event.type === "approval_required") {
		nextState.pendingApproval = {
			runId: prev.runId ?? "",
			name: event.payload.toolName,
			args: event.payload.args,
			toolCallId: event.payload.approvalId,
		};
	}

	if (event.type === "approval_decision") {
		nextState.pendingApproval =
			prev.pendingApproval?.toolCallId === event.payload.approvalId
				? null
				: prev.pendingApproval;
	}

	if (event.type === "usage") {
		nextState.usage = {
			prompt_tokens: event.payload.promptTokens,
			completion_tokens: event.payload.completionTokens,
			total_tokens: event.payload.totalTokens,
			cost: 0,
		};
	}

	return nextState;
}

// ──────────────────────────────────────
// Typed event consumer (backward compat)
// ──────────────────────────────────────

/**
 * Consume a typed AgentEvent and produce an updated StreamState.
 * Uses discriminated union narrowing for type-safe event handling.
 */
export function consumeTypedEvent(
	prev: StreamState,
	event: AgentEvent,
): StreamState {
	return reduceToolEventState(prev, event);
}
