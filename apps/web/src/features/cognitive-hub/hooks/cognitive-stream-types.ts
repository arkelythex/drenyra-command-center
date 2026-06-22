/**
 * Cognitive Stream — Core types and interfaces.
 *
 * Extracted from cognitive-stream.ts for maintainability.
 */

import type { AgentEvent } from "@arkelythex/shared";
import type {
	ContextApprovalState,
	ContextEvaluationSummaryDTO,
	ContextRegistrySurfaceDTO,
	ContextRetrievalMode,
	ContextTraceRecordDTO,
} from "@arkelythex/application";

// ──────────────────────────────────────
// Core types
// ──────────────────────────────────────

export interface Message {
	role: "user" | "assistant" | "system";
	content: string;
}

export type ModelTier = "reasoning" | "fast" | "code" | "vision";

export interface PendingToolApproval {
	runId: string;
	name: string;
	args: unknown;
	toolCallId: string;
	traceId?: string | null;
	surfaceId?: string | null;
	approvalState?: ContextApprovalState | null;
	pairingRequired?: boolean;
	pairingSessionId?: string | null;
	pairingHint?: string | null;
	pairingChallenge?: string | null;
	pairingCode?: string | null;
}

export interface StreamState {
	currentMessage: string;
	isStreaming: boolean;
	runId: string | null;
	pendingApproval: PendingToolApproval | null;
	usage: StreamUsage | null;
	activityTimeline: CognitiveActivityEntry[];
}

export interface RunStateRecord {
	runId: string;
	toolCallId: string;
	name: string;
	args: unknown;
	pairingRequired: boolean;
	pairingSessionId: string | null;
	pairingHint: string | null;
	pairingChallenge: string | null;
	status: "pending" | "approved" | "rejected" | "expired";
	decisionReason: string | null;
	requestedAt: string;
	decidedAt: string | null;
}

export interface RunStateResponse {
	success: boolean;
	data?: {
		runId: string;
		pendingApprovals: RunStateRecord[];
		recentDecisions: RunStateRecord[];
	};
}

export interface ControlPlaneRunSnapshot {
	traceId: string;
	surfaceId: string;
	surface: ContextRegistrySurfaceDTO | null;
	approvalState: ContextApprovalState;
	retrievalMode: ContextRetrievalMode | null;
	evaluationSummary: ContextEvaluationSummaryDTO | null;
	trace: ContextTraceRecordDTO[];
	documentarySources: Record<string, unknown>[];
	representativePath: boolean;
}

export interface StreamUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
	cost: number;
}

// ──────────────────────────────────────
// Activity timeline types
// ──────────────────────────────────────

export type CognitiveActivityStatus =
	| "info"
	| "success"
	| "warning"
	| "error"
	| "pending";

export interface CognitiveActivityEntry {
	id: string;
	runId: string | null;
	type: Exclude<AgentEvent["type"], "thinking" | "usage" | "progress">;
	label: string;
	detail: string | null;
	status: CognitiveActivityStatus;
	timestamp: string;
}

export interface ApprovalStateRecord {
	runId: string;
	toolCallId: string;
	name: string;
	status: "pending" | "approved" | "rejected" | "expired";
	decisionReason: string | null;
	requestedAt: string;
	decidedAt: string | null;
}
