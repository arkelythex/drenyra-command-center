import { useEffect, useRef, useCallback, useState } from "react";
import { useAgentActivityStore } from "../stores/agent-activity.store";
import { useAgentStream } from "../features/intelligence/hooks/useAgentStream";
import type { AgentSemanticState } from "../types/agent-activity";

type ConnectionMode = "sse" | "websocket" | "fallback";

/**
 * useAgentStreamBridge — bridges agent streaming to AgentActivityStore
 * with WebSocket fallback.
 *
 * Priority: WebSocket > SSE > polling fallback.
 * Auto-reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s).
 */
export function useAgentStreamBridge() {
	const addEvent = useAgentActivityStore((s) => s.addEvent);
	const startFeed = useAgentActivityStore((s) => s.startFeed);
	const setAgentState = useAgentActivityStore((s) => s.setAgentState);

	const [mode, setMode] = useState<ConnectionMode>("websocket");
	const [reconnectDelay, setReconnectDelay] = useState(1000);
	const startedAgents = useRef<Set<string>>(new Set());
	const wsRef = useRef<WebSocket | null>(null);
	const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// SSE fallback
	const { startStream, stopStream } = useAgentStream();

	const handleAgentEvent = useCallback(
		(event: {
			agentId?: string;
			runId: string;
			label?: string;
			status: string;
			message: string;
			timestamp: string;
		}) => {
			const agentId = event.agentId ?? event.runId;
			if (!startedAgents.current.has(agentId)) {
				startedAgents.current.add(agentId);
				startFeed(agentId, event.label ?? `Agente ${agentId.slice(0, 8)}`);
			}

			const stateMap: Record<string, AgentSemanticState> = {
				running: "working",
				completed: "completed",
				failed: "failed",
				blocked: "blocked",
				awaiting_approval: "waiting_for_approval",
			};
			setAgentState(agentId, stateMap[event.status] ?? "working");

			addEvent(agentId, {
				id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				agentId,
				timestamp: event.timestamp,
				type: "tool_executed",
				label: event.message.slice(0, 80),
				description: event.message,
				status: event.status === "failed" ? "failed" : "completed",
				riskLevel: undefined,
			});
		},
		[startFeed, setAgentState, addEvent],
	);

	const connectWebSocket = useCallback(() => {
		try {
			const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
			const wsUrl = `${protocol}//${window.location.host}/api/ws/agent-stream`;
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				setMode("websocket");
				setReconnectDelay(1000);
			};

			ws.onmessage = (e) => {
				try {
					const data = JSON.parse(e.data);
					handleAgentEvent(data);
				} catch {
					// ignore parse errors
				}
			};

			ws.onclose = () => {
				if (retryTimer.current) return;
				// Exponential backoff
				retryTimer.current = setTimeout(() => {
					retryTimer.current = null;
					setReconnectDelay((d) => Math.min(d * 2, 30000));
					connectWebSocket();
				}, reconnectDelay);
			};

			ws.onerror = () => {
				ws.close();
				// Fallback to SSE
				setMode("fallback");
				startStream({}, (event) =>
					handleAgentEvent({
						agentId: event.agentId,
						runId: event.runId,
						label: event.agentLabel,
						status: event.status,
						message: event.message,
						timestamp: event.timestamp,
					}),
				);
			};
		} catch {
			// WebSocket unavailable, fallback to SSE
			setMode("sse");
			startStream({}, (event) =>
				handleAgentEvent({
					agentId: event.agentId,
					runId: event.runId,
					label: event.agentLabel,
					status: event.status,
					message: event.message,
					timestamp: event.timestamp,
				}),
			);
		}
	}, [reconnectDelay, startStream, handleAgentEvent]);

	useEffect(() => {
		connectWebSocket();
		return () => {
			wsRef.current?.close();
			stopStream();
			startedAgents.current.clear();
			if (retryTimer.current) clearTimeout(retryTimer.current);
		};
	}, [connectWebSocket, stopStream]);

	return { mode, reconnect: connectWebSocket };
}
