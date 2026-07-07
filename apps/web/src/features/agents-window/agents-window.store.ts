import { create } from "zustand";

export interface AgentSession {
	id: string;
	agentId: string;
	agentName: string;
	clientName: string;
	period: string;
	status: "running" | "paused" | "completed" | "failed" | "awaiting-approval";
	phase: string;
	progress: number;
	changesProposed: number;
	evidenceCollected: number;
	elapsedMs: number;
	tokensUsed: number;
	risk: "low" | "medium" | "high" | "critical";
	requiresAction: boolean;
	lastActivity: string;
}

interface AgentsWindowState {
	sessions: AgentSession[];
	selectedSessionId: string | null;
	gridMode: "grid" | "tabs";
	filters: {
		status?: string;
		risk?: string;
		client?: string;
	};
	setSessions: (sessions: AgentSession[]) => void;
	updateSession: (id: string, partial: Partial<AgentSession>) => void;
	selectSession: (id: string | null) => void;
	setGridMode: (mode: "grid" | "tabs") => void;
	setFilters: (filters: Partial<AgentsWindowState["filters"]>) => void;
}

const MOCK_SESSIONS: AgentSession[] = [
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

export const useAgentsWindow = create<AgentsWindowState>()((set) => ({
	sessions: MOCK_SESSIONS,
	selectedSessionId: null,
	gridMode: "grid",
	filters: {},
	setSessions: (sessions) => set({ sessions }),
	updateSession: (id, partial) =>
		set((s) => ({
			sessions: s.sessions.map((session) =>
				session.id === id ? { ...session, ...partial } : session,
			),
		})),
	selectSession: (id) => set({ selectedSessionId: id }),
	setGridMode: (gridMode) => set({ gridMode }),
	setFilters: (filters) =>
		set((s) => ({ filters: { ...s.filters, ...filters } })),
}));
