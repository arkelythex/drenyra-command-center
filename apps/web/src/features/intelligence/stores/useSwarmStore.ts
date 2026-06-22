import { create } from "zustand";

export type SwarmRunStatus = "idle" | "running" | "completed" | "failed";
export type SwarmLogType =
	| "workflow-start"
	| "agent-status"
	| "workflow-complete"
	| "workflow-error"
	| "anomaly-alert"
	| "anomaly-alert-skipped";
export type SwarmLogLevel = "info" | "success" | "warning" | "error";

export interface SwarmLogEntry {
	id: string;
	runId: string;
	type: SwarmLogType;
	level: SwarmLogLevel;
	message: string;
	timestamp: string;
	agentName?: string;
	payload?: Record<string, unknown>;
}

export interface SwarmRunState {
	runId: string;
	status: SwarmRunStatus;
	logs: SwarmLogEntry[];
}

interface SwarmStore {
	activeRunId: string | null;
	runsById: Record<string, SwarmRunState>;
	lastError: string | null;
	setActiveRunId: (id: string | null) => void;
	setError: (error: string | null) => void;
	upsertRun: (
		runId: string,
		patch?: Partial<Omit<SwarmRunState, "runId" | "logs">>,
	) => void;
	appendRunLog: (
		runId: string,
		log: Omit<SwarmLogEntry, "id" | "runId">,
	) => void;
	setRunStatus: (runId: string, status: SwarmRunStatus) => void;
}

export const useSwarmStore = create<SwarmStore>((set) => ({
	activeRunId: null,
	runsById: {},
	lastError: null,
	setActiveRunId: (activeRunId) => set({ activeRunId }),
	setError: (lastError) => set({ lastError }),
	upsertRun: (runId, patch) =>
		set((state) => {
			const current = state.runsById[runId];
			return {
				runsById: {
					...state.runsById,
					[runId]: {
						runId,
						status: current?.status ?? patch?.status ?? "idle",
						logs: current?.logs ?? [],
						...(patch ?? {}),
					},
				},
			};
		}),
	appendRunLog: (runId, log) =>
		set((state) => {
			const current = state.runsById[runId] ?? {
				runId,
				status: "running" as const,
				logs: [],
			};
			const nextLog: SwarmLogEntry = {
				...log,
				id: `${runId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
				runId,
			};
			const nextLogs = [...current.logs, nextLog].slice(-120);

			return {
				runsById: {
					...state.runsById,
					[runId]: {
						...current,
						logs: nextLogs,
					},
				},
			};
		}),
	setRunStatus: (runId, status) =>
		set((state) => {
			const current = state.runsById[runId] ?? {
				runId,
				status: "idle" as const,
				logs: [],
			};
			return {
				runsById: {
					...state.runsById,
					[runId]: {
						...current,
						status,
					},
				},
			};
		}),
}));
