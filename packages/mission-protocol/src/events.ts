/**
 * Compatibility surface for the canonical drenyra-ai mission event/SSE
 * protocol: event types, wire format (single-line JSON over SSE), keepalive,
 * and sequence-based resume. Shared by both API and CLI.
 */
export type {
	/** A mission event as transmitted over SSE. */
	MissionEvent,
} from "drenyra-ai/missions";
export {
	/** Formats a `MissionEvent` as a complete SSE message. */
	formatSSEEvent,
	/** Returns true if the line is an SSE keepalive comment. */
	isKeepalive,
	/** All mission event types used in SSE streaming. */
	MissionEventType,
	/** Parses a single SSE line into a `MissionEvent`. */
	parseSSEEvent,
} from "drenyra-ai/missions";
