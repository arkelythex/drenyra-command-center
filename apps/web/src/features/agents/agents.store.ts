import { create } from "zustand";
import type { AgentFilters, GridMode } from "./agents.types";

export interface AgentsWindowState {
	selectedSessionId: string | null;
	gridMode: GridMode;
	pollingActive: boolean;
	filters: AgentFilters;
	selectSession: (id: string | null) => void;
	setGridMode: (mode: GridMode) => void;
	setPollingActive: (active: boolean) => void;
	setFilters: (patch: Partial<AgentFilters>) => void;
	resetFilters: () => void;
}

const DEFAULT_FILTERS: AgentFilters = {};

export const useAgentsWindowStore = create<AgentsWindowState>((set) => ({
	selectedSessionId: null,
	gridMode: "grid",
	pollingActive: true,
	filters: { ...DEFAULT_FILTERS },

	selectSession: (id) => set({ selectedSessionId: id }),
	setGridMode: (mode) => set({ gridMode: mode }),
	setPollingActive: (active) => set({ pollingActive: active }),
	setFilters: (patch) =>
		set((state) => ({
			filters: { ...state.filters, ...patch },
		})),
	resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
}));
