/**
 * Cognitive Stream Hook - POST-based SSE streaming client
 *
 * Uses fetch() with ReadableStream (not EventSource, which only supports GET)
 *
 * @since Feb 2026
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getGovernanceAuditHeaders, getOrganizationId } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { captureError } from "@/lib/monitoring";
import type {
	AgentEvent,
	ApprovalStateRecord,
	Message,
	ModelTier,
	PendingToolApproval,
	RunStateResponse,
	StreamState,
} from "./cognitive-stream";
import {
	buildCognitiveApiUrl,
	buildCognitiveHeaders,
	clearPersistedTimeline,
	consumeSseBuffer,
	mergeRecoveredActivities,
	parseSseEventChunks,
	readPersistedRunId,
	readPersistedTimeline,
	reduceToolEventState,
	writePersistedTimeline,
} from "./cognitive-stream";

export type { PendingToolApproval } from "./cognitive-stream";

export function useCognitiveStream() {
	const [state, setState] = useState<StreamState>({
		currentMessage: "",
		isStreaming: false,
		runId: readPersistedRunId(),
		pendingApproval: null,
		usage: null,
		activityTimeline: readPersistedTimeline(),
	});

	const abortControllerRef = useRef<AbortController | null>(null);
	const runIdRef = useRef(state.runId);
	runIdRef.current = state.runId;

	useEffect(() => {
		writePersistedTimeline(state.activityTimeline);
	}, [state.activityTimeline]);

	const streamMessage = useCallback(
		async (
			messages: Message[],
			modelTier: ModelTier = "fast",
			onEvent?: (event: AgentEvent) => void,
		) => {
			setState((prev) => ({
				...prev,
				isStreaming: true,
				runId: null,
				currentMessage: "",
				pendingApproval: null,
			}));

			abortControllerRef.current = new AbortController();

			try {
				const response = await fetch(
					buildCognitiveApiUrl("/api/ai-swarm/cognitive-stream"),
					{
						method: "POST",
						headers: buildCognitiveHeaders(getOrganizationId()),
						body: JSON.stringify({
							messages,
							modelTier,
							tools: true,
							runId: state.runId ?? readPersistedRunId() ?? undefined,
						}),
						signal: abortControllerRef.current.signal,
					},
				);

				if (!response.ok) {
					throw new Error(
						`Stream failed: ${response.status} ${response.statusText}`,
					);
				}

				if (!response.body) {
					throw new Error("Response body is null");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				const applyEvents = (events: Array<{ data: string }>) => {
					for (const parsedEvent of parseSseEventChunks(events, runIdRef.current)) {
						setState((prev) => reduceToolEventState(prev, parsedEvent));
						onEvent?.(parsedEvent);
					}
				};

				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						applyEvents(consumeSseBuffer(`${buffer}\n\n`).events);
						break;
					}

					buffer += decoder.decode(value, { stream: true });
					const { events, rest } = consumeSseBuffer(buffer);
					buffer = rest;
					applyEvents(events);
				}
			} catch (error) {
				const isAbort = error instanceof Error && error.name === "AbortError";
				if (!isAbort) {
					captureError(
						error instanceof Error
							? error
							: new Error("Cognitive stream failed"),
						{
							source: "cognitive-stream.stream-message",
						},
					);
				}
			} finally {
				setState((prev) => ({ ...prev, isStreaming: false }));
			}
		},
		[state.runId],
	);

	const submitApprovalDecision = useCallback(
		async (
			approval: PendingToolApproval,
			approved: boolean,
			options?: { pairingCode?: string; reason?: string },
		) => {
			await unwrap(
				api.api["ai-swarm"]["cognitive-stream"].approval.post({
					body: {
						runId: approval.runId,
						toolCallId: approval.toolCallId,
						approved,
						pairingCode: options?.pairingCode,
						reason: options?.reason,
					},
					headers: {
						...getGovernanceAuditHeaders(),
						"x-organization-id": getOrganizationId(),
					},
				}),
			);

			setState((prev) => ({
				...prev,
				pendingApproval:
					prev.pendingApproval?.toolCallId === approval.toolCallId
						? null
						: prev.pendingApproval,
			}));
		},
		[],
	);

	const recoverRunState = useCallback(
		async (runId?: string) => {
			const candidateRunId = runId ?? state.runId ?? readPersistedRunId();
			if (!candidateRunId) return null;

			const response = await unwrap(
				api.api["ai-swarm"]["cognitive-stream"]
					.runs({ runId: candidateRunId })
					.state.get({
						headers: {
							...getGovernanceAuditHeaders(),
							"x-organization-id": getOrganizationId(),
						},
					}),
			);

			const payload = extractOkData(
				response,
				"Run state recovery failed",
			) as RunStateResponse;
			const firstPending = payload.data?.pendingApprovals?.[0];

			const stateRecords: ApprovalStateRecord[] = [
				...(payload.data?.pendingApprovals ?? []),
				...(payload.data?.recentDecisions ?? []),
			].map((record) => ({
				runId: record.runId,
				toolCallId: record.toolCallId,
				name: record.name,
				status: record.status,
				decisionReason: record.decisionReason,
				requestedAt: record.requestedAt,
				decidedAt: record.decidedAt,
			}));

			setState((prev) => ({
				...prev,
				runId: candidateRunId,
				activityTimeline: mergeRecoveredActivities(
					prev.activityTimeline,
					stateRecords,
				),
				pendingApproval: firstPending
					? {
							runId: firstPending.runId,
							toolCallId: firstPending.toolCallId,
							name: firstPending.name,
							args: firstPending.args,
							pairingRequired: firstPending.pairingRequired,
							pairingSessionId: firstPending.pairingSessionId,
							pairingHint: firstPending.pairingHint,
							pairingChallenge: firstPending.pairingChallenge,
						}
					: null,
			}));

			return payload.data ?? null;
		},
		[state.runId],
	);

	const stopStream = useCallback(() => {
		abortControllerRef.current?.abort();
	}, []);

	const clearTimeline = useCallback(() => {
		setState((prev) => ({
			...prev,
			activityTimeline: [],
		}));
		clearPersistedTimeline();
	}, []);

	return {
		...state,
		streamMessage,
		submitApprovalDecision,
		recoverRunState,
		stopStream,
		clearTimeline,
	};
}
