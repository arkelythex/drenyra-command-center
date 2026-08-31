import type { AgentEvent, AgentEventType } from "../events/agent-events";

export type { AgentEvent, AgentEventType };
export type HubViewMode = "minimized" | "chat" | "swarm" | "commands";
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
export interface BackgroundMission {
	id: string;
	title: string;
	status: "active" | "completed" | "failed" | "alert";
	progress: number;
	agentId: string;
	startedAt: string;
	priority?: "normal" | "high" | "critical";
}
//# sourceMappingURL=types.d.ts.map
