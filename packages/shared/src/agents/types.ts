/**
 * Agent core types — view modes, swarm traces, background missions.
 *
 * Extracted from `cognitive-hub` feature for cross-package reuse.
 *
 * @module agents/types
 */

import type { AgentEvent, AgentEventType } from "../events/agent-events";

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { AgentEvent, AgentEventType };

// ─── Hub view mode ───────────────────────────────────────────────────────────

export type HubViewMode = "minimized" | "chat" | "swarm" | "commands";

// ─── Swarm trace types ───────────────────────────────────────────────────────

export interface SwarmStep {
	agentId: string;
	agentName: string;
	status: "idle" | "running" | "completed" | "failed";
	message: string;
	timestamp: string;
}

export interface SwarmTrace {
	runId: string;
	steps: SwarmStep[];
	isLive: boolean;
}

// ─── Background mission ──────────────────────────────────────────────────────

export interface BackgroundMission {
	id: string;
	title: string;
	status: "active" | "completed" | "failed" | "alert";
	progress: number;
	agentId: string;
	startedAt: string;
	priority?: "normal" | "high" | "critical";
}
