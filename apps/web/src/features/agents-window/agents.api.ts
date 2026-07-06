import { api } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import type { AgentSession } from "./agents-window.store";

/**
 * Agent Sessions API
 *
 * Currently uses mock data. When the backend endpoint is ready,
 * these functions will call the real API.
 */

export async function fetchAgentSessions(): Promise<AgentSession[]> {
	try {
		return unwrap(api.api.agents.sessions.get()) as unknown as Promise<
			AgentSession[]
		>;
	} catch {
		return getMockSessions();
	}
}

export async function fetchAgentSessionDetails(
	sessionId: string,
): Promise<AgentSession> {
	try {
		return unwrap(
			api.api.agents.sessions({ id: sessionId }).get(),
		) as unknown as Promise<AgentSession>;
	} catch {
		const mock = getMockSessions().find((s) => s.id === sessionId);
		if (!mock) throw new Error(`Session ${sessionId} not found`);
		return mock;
	}
}

export async function pauseAgentSession(sessionId: string): Promise<void> {
	try {
		await unwrap(api.api.agents.sessions({ id: sessionId }).pause.post());
	} catch {
		console.warn(`[AgentSessions] pause(${sessionId}): API not available`);
	}
}

export async function resumeAgentSession(sessionId: string): Promise<void> {
	try {
		await unwrap(api.api.agents.sessions({ id: sessionId }).resume.post());
	} catch {
		console.warn(`[AgentSessions] resume(${sessionId}): API not available`);
	}
}

export async function cancelAgentSession(sessionId: string): Promise<void> {
	try {
		await unwrap(api.api.agents.sessions({ id: sessionId }).cancel.post());
	} catch {
		console.warn(`[AgentSessions] cancel(${sessionId}): API not available`);
	}
}

export async function fetchAgentTimeline(
	sessionId: string,
): Promise<AgentTimelineEvent[]> {
	try {
		return unwrap(
			api.api.agents.sessions({ id: sessionId }).timeline.get(),
		) as unknown as Promise<AgentTimelineEvent[]>;
	} catch {
		return [];
	}
}

export interface AgentTimelineEvent {
	id: string;
	sessionId: string;
	eventType: string;
	description: string;
	phase?: string;
	progress?: number;
	metadata?: Record<string, unknown>;
	timestamp: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

function getMockSessions(): AgentSession[] {
	return [
		{
			id: "sess-1",
			agentId: "sire-agent",
			agentName: "SIRE Agent",
			clientName: "Andrés Capital SAC",
			period: "2026-06",
			status: "running",
			phase: "Validando 842 CPE",
			progress: 80,
			changesProposed: 12,
			evidenceCollected: 8,
			elapsedMs: 272000,
			tokensUsed: 12482,
			risk: "low",
			requiresAction: false,
			lastActivity: new Date().toISOString(),
		},
		{
			id: "sess-2",
			agentId: "recon-agent",
			agentName: "Reconciliation Agent",
			clientName: "Nova SAC",
			period: "2026-06",
			status: "running",
			phase: "Emparejando 152 movimientos",
			progress: 60,
			changesProposed: 3,
			evidenceCollected: 45,
			elapsedMs: 130000,
			tokensUsed: 8231,
			risk: "medium",
			requiresAction: false,
			lastActivity: new Date(Date.now() - 120000).toISOString(),
		},
		{
			id: "sess-3",
			agentId: "tax-risk-agent",
			agentName: "Tax Risk Agent",
			clientName: "Luna EIRL",
			period: "2026-06",
			status: "running",
			phase: "Analizando 5 riesgos detectados",
			progress: 55,
			changesProposed: 5,
			evidenceCollected: 12,
			elapsedMs: 372000,
			tokensUsed: 15200,
			risk: "high",
			requiresAction: true,
			lastActivity: new Date(Date.now() - 60000).toISOString(),
		},
		{
			id: "sess-4",
			agentId: "close-agent",
			agentName: "Close Agent",
			clientName: "Pacifico Retail SAC",
			period: "2026-06",
			status: "running",
			phase: "Preparando cierre mensual",
			progress: 95,
			changesProposed: 18,
			evidenceCollected: 23,
			elapsedMs: 65000,
			tokensUsed: 4500,
			risk: "low",
			requiresAction: true,
			lastActivity: new Date(Date.now() - 30000).toISOString(),
		},
	];
}
