/**
 * SSE (Server-Sent Events) serialization helpers for typed agent events.
 *
 * Encodes and decodes AgentEvent to/from the standard SSE wire format:
 *   event: {type}\n
 *   data: {JSON}\n\n
 *
 * Zero runtime dependencies — uses only built-in JSON.parse/stringify.
 *
 * @module sse-helpers
 */

import type { AgentEvent } from "./agent-events";

/**
 * Serialize an AgentEvent to SSE wire format.
 *
 * Produces:
 *   event: run_started\n
 *   data: {"id":"...","runId":"...",...}\n\n
 */
export function serializeEvent(event: AgentEvent): string {
	const lines = [`event: ${event.type}`, `data: ${JSON.stringify(event)}`, ""];
	return lines.join("\n");
}

/**
 * Deserialize an SSE-formatted string back to a typed AgentEvent.
 *
 * Returns `null` on any parse failure (invalid JSON, missing fields, etc.)
 * to keep the function safe for streaming parsers.
 */
export function deserializeEvent(raw: string): AgentEvent | null {
	try {
		const lines = raw.split("\n");
		let eventType = "";
		let dataStr = "";

		for (const line of lines) {
			if (line.startsWith("event: ")) {
				eventType = line.slice("event: ".length);
			} else if (line.startsWith("data: ")) {
				dataStr = line.slice("data: ".length);
			}
		}

		if (!eventType || !dataStr) {
			return null;
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime safety
		if (!isKnownEventType(eventType)) {
			return null;
		}

		const parsed = JSON.parse(dataStr) as Record<string, unknown>;

		// Basic structural validation
		if (
			typeof parsed.id !== "string" ||
			typeof parsed.runId !== "string" ||
			typeof parsed.timestamp !== "number"
		) {
			return null;
		}

		// Ensure the parsed type matches the event line
		if (parsed.type !== eventType) {
			return null;
		}

		return parsed as unknown as AgentEvent;
	} catch {
		return null;
	}
}

/**
 * Runtime type guard that checks if an unknown value is a valid AgentEvent.
 *
 * Validates structure recursively:
 * - Base fields: id (string), runId (string), timestamp (number)
 * - type (string matching known event types)
 * - payload (object, non-null)
 */
export function isAgentEvent(data: unknown): data is AgentEvent {
	if (typeof data !== "object" || data === null) {
		return false;
	}

	const candidate = data as Record<string, unknown>;

	if (
		typeof candidate.id !== "string" ||
		typeof candidate.runId !== "string" ||
		typeof candidate.timestamp !== "number" ||
		typeof candidate.type !== "string"
	) {
		return false;
	}

	if (!isKnownEventType(candidate.type)) {
		return false;
	}

	if (typeof candidate.payload !== "object" || candidate.payload === null) {
		return false;
	}

	return true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const KNOWN_EVENT_TYPES = [
	"run_started",
	"thinking",
	"tool_call",
	"tool_result",
	"tool_error",
	"progress",
	"approval_required",
	"approval_decision",
	"usage",
	"complete",
	"error",
] as const;

function isKnownEventType(type: string): type is AgentEvent["type"] {
	return (KNOWN_EVENT_TYPES as readonly string[]).includes(type);
}
