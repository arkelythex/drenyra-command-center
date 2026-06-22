import { useCallback, useRef, useState } from "react";
import { useSwarmStore } from "@/features/intelligence/stores/useSwarmStore";
import { getOrganizationId } from "@/lib/api";
import { captureError } from "@/lib/monitoring";
import { runtimeConfig } from "@/lib/runtime-config";

export interface AgentStreamEvent {
	runId: string;
	agentId: string;
	agentLabel: string;
	status: "running" | "completed" | "failed";
	message: string;
	timestamp: string;
}

interface WorkflowStartEvent {
	runId: string;
	filename?: string;
	timestamp: string;
}

interface WorkflowCompleteEvent {
	runId: string;
	status: "success" | "failed" | "cancelled";
	error?: string;
	timestamp: string;
}

interface WorkflowErrorEvent {
	runId: string;
	error: string;
	timestamp: string;
}

interface AnomalyAlertEvent {
	runId: string;
	severity: "low" | "medium" | "high" | "critical";
	consensusScore: number;
	threshold: number;
	timestamp: string;
}

interface AnomalyAlertSkippedEvent {
	runId: string;
	reason: string;
	timestamp: string;
}

function parseSseData<T>(event: MessageEvent): T | null {
	try {
		return JSON.parse(event.data) as T;
	} catch {
		return null;
	}
}

export function useAgentStream() {
	const [isStreaming, setIsStreaming] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		"connected" | "disconnected" | "connecting"
	>("disconnected");
	const eventSourceRef = useRef<EventSource | null>(null);
	const setActiveRunId = useSwarmStore((state) => state.setActiveRunId);
	const setError = useSwarmStore((state) => state.setError);
	const upsertRun = useSwarmStore((state) => state.upsertRun);
	const appendRunLog = useSwarmStore((state) => state.appendRunLog);
	const setRunStatus = useSwarmStore((state) => state.setRunStatus);

	const stopStream = useCallback(() => {
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}
		setIsStreaming(false);
		setConnectionStatus("disconnected");
	}, []);

	const startStream = useCallback(
		(
			query: Record<string, string> = {},
			onEvent?: (event: AgentStreamEvent) => void,
		) => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}

			setConnectionStatus("connecting");
			setIsStreaming(true);
			setError(null);

			const normalizedQuery = { ...query };
			if (!normalizedQuery.orgId) {
				const orgId = getOrganizationId();
				if (orgId) normalizedQuery.orgId = orgId;
			}

			const params = new URLSearchParams(normalizedQuery);
			const url = `${runtimeConfig.apiUrl}/api/ai-swarm/agent-stream?${params.toString()}`;

			const es = new EventSource(url);
			eventSourceRef.current = es;

			es.addEventListener("open", () => {
				setConnectionStatus("connected");
			});

			es.addEventListener("agent-status", (e) => {
				const data = parseSseData<AgentStreamEvent>(e);
				if (!data) {
					captureError(new Error("Error parsing agent status event"), {
						source: "intelligence.agent-stream.parse-status",
						payloadPreview: String((e as MessageEvent).data).slice(0, 200),
					});
					return;
				}

				setActiveRunId(data.runId);
				upsertRun(data.runId, {
					status: data.status === "failed" ? "failed" : "running",
				});
				appendRunLog(data.runId, {
					type: "agent-status",
					level:
						data.status === "failed"
							? "error"
							: data.status === "completed"
								? "success"
								: "info",
					message: data.message,
					timestamp: data.timestamp,
					agentName: data.agentLabel,
					payload: data as unknown as Record<string, unknown>,
				});

				if (data.status === "failed") {
					setError(`Fallo en ${data.agentLabel}: ${data.message}`);
				}
				if (onEvent) onEvent(data);
			});

			es.addEventListener("workflow-start", (e) => {
				const data = parseSseData<WorkflowStartEvent>(e);
				if (!data) return;
				setActiveRunId(data.runId);
				upsertRun(data.runId, { status: "running" });
				appendRunLog(data.runId, {
					type: "workflow-start",
					level: "info",
					message: data.filename
						? `Iniciando procesamiento de ${data.filename}.`
						: "Iniciando procesamiento de documento.",
					timestamp: data.timestamp,
					agentName: "Orquestador",
					payload: data as unknown as Record<string, unknown>,
				});
			});

			es.addEventListener("anomaly-alert", (e) => {
				const data = parseSseData<AnomalyAlertEvent>(e);
				if (!data) return;
				appendRunLog(data.runId, {
					type: "anomaly-alert",
					level:
						data.severity === "critical" || data.severity === "high"
							? "error"
							: "warning",
					message: `Alerta ${data.severity.toUpperCase()} · consenso ${(data.consensusScore * 100).toFixed(1)}% / umbral ${(data.threshold * 100).toFixed(0)}%`,
					timestamp: data.timestamp,
					agentName: "Arbitro",
					payload: data as unknown as Record<string, unknown>,
				});
			});

			es.addEventListener("anomaly-alert-skipped", (e) => {
				const data = parseSseData<AnomalyAlertSkippedEvent>(e);
				if (!data) return;
				appendRunLog(data.runId, {
					type: "anomaly-alert-skipped",
					level: "warning",
					message: `Alerta omitida: ${data.reason}.`,
					timestamp: data.timestamp,
					agentName: "Sistema",
					payload: data as unknown as Record<string, unknown>,
				});
			});

			es.addEventListener("workflow-complete", (e) => {
				const data = parseSseData<WorkflowCompleteEvent>(e);
				if (!data) {
					stopStream();
					return;
				}

				const status = data.status === "success" ? "completed" : "failed";
				setRunStatus(data.runId, status);
				appendRunLog(data.runId, {
					type: "workflow-complete",
					level: status === "completed" ? "success" : "error",
					message:
						status === "completed"
							? "Workflow completado con exito."
							: `Workflow finalizo con error: ${data.error ?? "sin detalle"}.`,
					timestamp: data.timestamp,
					agentName: "Orquestador",
					payload: data as unknown as Record<string, unknown>,
				});

				if (status === "failed") {
					setError(data.error ?? "El workflow finalizo con error.");
				}
				stopStream();
			});

			es.addEventListener("workflow-error", (e) => {
				const data = parseSseData<WorkflowErrorEvent>(e);
				if (data?.runId) {
					setRunStatus(data.runId, "failed");
					appendRunLog(data.runId, {
						type: "workflow-error",
						level: "error",
						message: data.error,
						timestamp: data.timestamp,
						agentName: "Orquestador",
						payload: data as unknown as Record<string, unknown>,
					});
				}
				setError(data?.error ?? "Workflow error event");
				stopStream();
			});

			es.onerror = () => {
				captureError(new Error("SSE stream error"), {
					source: "intelligence.agent-stream.sse",
				});
				setError("Se perdio la conexion SSE con el enjambre.");
				setConnectionStatus("disconnected");
				setIsStreaming(false);
				es.close();
			};
		},
		[
			appendRunLog,
			setActiveRunId,
			setError,
			setRunStatus,
			stopStream,
			upsertRun,
		],
	);

	return {
		startStream,
		stopStream,
		isStreaming,
		connectionStatus,
	};
}
