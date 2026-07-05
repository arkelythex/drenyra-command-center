/**
 * Cognitive Stream — SSE parser and event normalizer.
 *
 * Extracted from cognitive-stream.ts for maintainability.
 */

import type { AgentEvent } from "@drenyra/shared";
import { captureError } from "@/lib/monitoring";

let eventIdCounter = 0;

// ──────────────────────────────────────
// SSE event types
// ──────────────────────────────────────

export interface SseEventChunk {
	event: string | null;
	data: string;
}

// ──────────────────────────────────────
// SSE parser
// ──────────────────────────────────────

function normalizeLineEndings(value: string): string {
	return value.replaceAll("\r\n", "\n");
}

function parseSseBlock(block: string): SseEventChunk | null {
	const lines = block.split("\n");
	let eventName: string | null = null;
	const dataLines: string[] = [];

	for (const line of lines) {
		if (!line || line.startsWith(":")) continue;
		if (line.startsWith("event:")) {
			eventName = line.slice(6).trim() || null;
			continue;
		}
		if (line.startsWith("data:")) {
			dataLines.push(line.slice(5).trimStart());
		}
	}

	if (dataLines.length === 0) return null;
	return {
		event: eventName,
		data: dataLines.join("\n"),
	};
}

export function consumeSseBuffer(buffer: string): {
	events: SseEventChunk[];
	rest: string;
} {
	const normalized = normalizeLineEndings(buffer);
	const events: SseEventChunk[] = [];
	let cursor = 0;

	while (true) {
		const boundary = normalized.indexOf("\n\n", cursor);
		if (boundary === -1) {
			return {
				events,
				rest: normalized.slice(cursor),
			};
		}

		const rawBlock = normalized.slice(cursor, boundary).trim();
		cursor = boundary + 2;
		if (!rawBlock) continue;

		const parsed = parseSseBlock(rawBlock);
		if (parsed) events.push(parsed);
	}
}

// ──────────────────────────────────────
// Event normalizer (raw SSE → AgentEvent)
// ──────────────────────────────────────

/**
 * Normalize a raw SSE event (ToolStreamEvent wire format) into a canonical AgentEvent.
 * This bridges the legacy API format to the typed event system.
 */
export function normalizeRawToAgentEvent(
	raw: Record<string, unknown>,
	currentRunId?: string | null,
): AgentEvent | null {
	const id = `evt_${Date.now()}_${++eventIdCounter}`;
	const timestamp = Date.now();
	const runId = (raw.runId as string) ?? currentRunId ?? "";
	const type = raw.type as string;

	switch (type) {
		case "run_started":
			return {
				id,
				runId: (raw.runId as string) ?? "",
				timestamp,
				type: "run_started",
				payload: {
					runId: (raw.runId as string) ?? "",
					startedAt:
						typeof raw.timestamp === "number"
							? (raw.timestamp as number)
							: timestamp,
				},
			};

		case "token":
			return {
				id,
				runId,
				timestamp,
				type: "thinking",
				payload: {
					content: String(raw.content ?? ""),
					agentId: "",
				},
			};

		case "tool_call_start":
			return {
				id,
				runId,
				timestamp,
				type: "tool_call",
				payload: {
					toolName: String(raw.name ?? ""),
					args: raw.args as Record<string, unknown>,
					callId: String(raw.id ?? ""),
				},
			};

		case "tool_executing":
			return null;

		case "tool_result":
			return {
				id,
				runId,
				timestamp,
				type: "tool_result",
				payload: {
					toolName: String(raw.name ?? ""),
					callId: "",
					result: raw.result,
					duration:
						typeof raw.duration === "number" ? (raw.duration as number) : 0,
				},
			};

		case "tool_error":
			return {
				id,
				runId,
				timestamp,
				type: "tool_error",
				payload: {
					toolName: String(raw.name ?? ""),
					callId: "",
					error: String(raw.error ?? ""),
				},
			};

		case "approval_required":
			return {
				id,
				runId,
				timestamp,
				type: "approval_required",
				payload: {
					approvalId: String(raw.toolCallId ?? ""),
					toolName: String(raw.name ?? ""),
					args: raw.args as Record<string, unknown>,
					risk: "medium" as const,
					reason: String(raw.reason ?? "Approval required"),
				},
			};

		case "approval_decision":
			return {
				id,
				runId,
				timestamp,
				type: "approval_decision",
				payload: {
					approvalId: String(raw.toolCallId ?? ""),
					decision: raw.approved ? ("approved" as const) : ("denied" as const),
					reason: raw.reason as string | undefined,
				},
			};

		case "usage":
			return {
				id,
				runId,
				timestamp,
				type: "usage",
				payload: {
					promptTokens: (raw.prompt_tokens as number) ?? 0,
					completionTokens: (raw.completion_tokens as number) ?? 0,
					totalTokens: (raw.total_tokens as number) ?? 0,
					modelId: String(raw.model ?? raw.modelId ?? ""),
				},
			};

		case "done":
			return {
				id,
				runId,
				timestamp,
				type: "complete",
				payload: {
					result: null,
					duration:
						typeof raw.duration === "number" ? (raw.duration as number) : 0,
					toolCalls: (raw.tool_calls as number) ?? 0,
				},
			};

		default:
			return null;
	}
}

/**
 * Parse raw SSE event chunks into typed AgentEvent[].
 */
export function parseSseEventChunks(
	rawEvents: Array<{ data: string }>,
	currentRunId?: string | null,
): AgentEvent[] {
	const parsed: AgentEvent[] = [];

	for (const eventChunk of rawEvents) {
		try {
			const raw = JSON.parse(eventChunk.data) as Record<string, unknown>;
			const normalized = normalizeRawToAgentEvent(raw, currentRunId);
			if (normalized) parsed.push(normalized);
		} catch (parseError) {
			captureError(
				parseError instanceof Error
					? parseError
					: new Error("Failed to parse SSE data"),
				{
					source: "cognitive-stream.parse-sse",
					payloadPreview: eventChunk.data.slice(0, 200),
				},
			);
		}
	}

	return parsed;
}

/**
 * Parse a raw SSE event string into a typed AgentEvent.
 * Returns null if parsing or normalization fails.
 */
export function parseTypedSseEvent(
	raw: string,
	currentRunId?: string | null,
): AgentEvent | null {
	try {
		const data = JSON.parse(raw) as Record<string, unknown>;
		return normalizeRawToAgentEvent(data, currentRunId);
	} catch {
		return null;
	}
}
