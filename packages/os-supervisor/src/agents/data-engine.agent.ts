/**
 * Data Engine Agent — TypeScript HTTP client for the AI Engine Brain.
 *
 * Implements OSAgentPort by forwarding structured tasks to the Data Engine
 * Python agent router (ADR-017 Phase 1). Each task.type maps to a REST
 * endpoint on the Data Engine (classify, reconcile, forecast, anomalies,
 * ocr, sire-validate).
 *
 * Graceful degradation: when the Data Engine is unavailable, the agent
 * returns success: false with a descriptive error — it never throws or
 * crashes the supervisor.
 *
 * @module agents/data-engine
 */

import { traceAgentExecution } from "../telemetry/operations.js";
import type {
	OSAgentContext,
	OSAgentPort,
	OSAgentResult,
} from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

// ── Types ────────────────────────────────────────────────────────────

export interface DataEngineTask {
	/** Agent sub-type, must be one of the known capabilities */
	type: string;
	/** Raw input text or JSON string */
	input: string;
	/** Scoping metadata */
	context: {
		tenantId?: string;
		organizationId?: string;
		companyId?: string;
		ruc?: string;
		traceId?: string;
		[key: string]: unknown;
	};
}

export interface DataEngineOutput {
	result: unknown;
	agentType: string;
	executionTimeMs: number;
	confidence?: number;
}

interface AgentResponseEnvelope {
	success: boolean;
	data?: {
		result?: unknown;
		agent_type?: string;
		execution_time_ms?: number;
		confidence?: number;
	};
	error?: string;
}

// ── Constants ────────────────────────────────────────────────────────

/**
 * Maps capability names to Data Engine REST endpoints.
 */
const CAPABILITY_ENDPOINTS: Record<string, string> = {
	classify: "classify",
	reconcile: "reconcile",
	forecast: "forecast",
	anomalies: "anomalies",
	ocr: "ocr",
	"sire-validate": "sire-validate",
};

const DEFAULT_DATA_ENGINE_URL = "http://localhost:8000";
const AGENT_TIMEOUT_MS = 10_000;

// ── Helpers ──────────────────────────────────────────────────────────

function errorResult(
	startTime: number,
	message: string,
): OSAgentResult<DataEngineOutput> {
	return {
		success: false,
		data: null,
		metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
		agentId: "data-engine",
		errors: [message],
	};
}

function successResult(
	elapsedMs: number,
	output: DataEngineOutput,
): OSAgentResult<DataEngineOutput> {
	return {
		success: true,
		data: output,
		metrics: { duration: elapsedMs, tokensUsed: 0, cost: 0 },
		agentId: "data-engine",
	};
}

function buildRequestBody(task: DataEngineTask): string {
	return JSON.stringify({
		input: task.input,
		context: {
			tenantId: task.context.tenantId,
			organizationId: task.context.organizationId,
			companyId: task.context.companyId,
			ruc: task.context.ruc,
			traceId: task.context.traceId,
		},
	});
}

function classifyError(error: unknown): string {
	if (error instanceof DOMException && error.name === "TimeoutError") {
		return "Data Engine request timed out after 10 seconds";
	}
	if (error instanceof TypeError) {
		return "Data Engine unavailable — fallback to conversational response";
	}
	return `Data Engine request failed: ${error instanceof Error ? error.message : String(error)}`;
}

async function callDataEngine(
	baseUrl: string,
	endpoint: string,
	task: DataEngineTask,
): Promise<{
	elapsedMs: number;
	response: Response;
	raw: AgentResponseEnvelope;
}> {
	const url = `${baseUrl}/api/v1/agents/${endpoint}`;
	const body = buildRequestBody(task);

	const startTime = Date.now();
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body,
		signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
	});
	const elapsedMs = Date.now() - startTime;
	const raw: AgentResponseEnvelope = await response.json();

	return { elapsedMs, response, raw };
}

function parseSuccessData(
	raw: AgentResponseEnvelope,
	taskType: string,
	elapsedMs: number,
): DataEngineOutput {
	return {
		result: raw.data?.result,
		agentType: raw.data?.agent_type ?? taskType,
		executionTimeMs: raw.data?.execution_time_ms ?? elapsedMs,
		confidence: raw.data?.confidence,
	};
}

// ── Factory ──────────────────────────────────────────────────────────

/**
 * Creates a Data Engine agent that forwards tasks to the Python AI Engine.
 *
 * @param dataEngineUrl - Base URL of the Data Engine API
 *                        (default: http://localhost:8000)
 */
export function createDataEngineAgent(
	dataEngineUrl?: string,
): OSAgentPort<DataEngineTask, DataEngineOutput> {
	const baseUrl = (dataEngineUrl ?? DEFAULT_DATA_ENGINE_URL).replace(
		/\/+$/,
		"",
	);

	return {
		id: "data-engine",
		name: "Data Engine Agent",
		description:
			"Executes structured AI workflows — classification, reconciliation, forecasting, anomaly detection, OCR, and SIRE validation",
		vertical: VerticalType.DRENYRA,
		capabilities: [
			"classify",
			"reconcile",
			"forecast",
			"anomalies",
			"ocr",
			"sire-validate",
		],

		execute: async (
			task: DataEngineTask,
			_context: OSAgentContext,
		): Promise<OSAgentResult<DataEngineOutput>> => {
			return await traceAgentExecution("data-engine", "drenyra", async () => {
				const startTime = Date.now();

				const endpoint = CAPABILITY_ENDPOINTS[task.type];
				if (!endpoint) {
					return errorResult(
						startTime,
						`Unknown Data Engine capability: '${task.type}'. ` +
							`Supported: ${Object.keys(CAPABILITY_ENDPOINTS).join(", ")}`,
					);
				}

				try {
					const { elapsedMs, response, raw } = await callDataEngine(
						baseUrl,
						endpoint,
						task,
					);

					if (!response.ok) {
						return errorResult(
							startTime,
							raw.error ?? `Data Engine returned HTTP ${response.status}`,
						);
					}

					if (!raw.success || !raw.data) {
						return errorResult(
							startTime,
							raw.error ?? "Data Engine returned unsuccessful response",
						);
					}

					const output = parseSuccessData(raw, task.type, elapsedMs);
					return successResult(elapsedMs, output);
				} catch (error) {
					return errorResult(startTime, classifyError(error));
				}
			});
		},
	};
}
