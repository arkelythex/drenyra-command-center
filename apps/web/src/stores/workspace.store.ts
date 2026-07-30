import { create } from "zustand";

/**
 * Workspace store — ephemeral UI preferences only.
 * Canonical workspace state (company, period, intent) comes from URL params.
 *
 * URL params → canonical workspace state
 * This store → ephemeral UI preferences
 */
export interface WorkspaceUIState {
	// Selected panel within the workspace
	activePanelId: string | null;
	setActivePanel: (id: string | null) => void;

	// Whether the workspace is initialized
	isReady: boolean;
	setReady: (ready: boolean) => void;

	// Workspace layout configuration (pane sizes, ordering)
	layout: Record<string, unknown>;
	updateLayout: (layout: Record<string, unknown>) => void;
	resetLayout: () => void;

	// Density override (null = follows global preference)
	densityOverride: "compact" | "normal" | "spacious" | null;
	setDensityOverride: (density: "compact" | "normal" | "spacious" | null) => void;
}

export const useWorkspaceStore = create<WorkspaceUIState>()((set) => ({
	activePanelId: null,
	setActivePanel: (id) => set({ activePanelId: id }),

	isReady: false,
	setReady: (ready) => set({ isReady: ready }),

	layout: {},
	updateLayout: (layout) => set({ layout }),
	resetLayout: () => set({ layout: {} }),

	densityOverride: null,
	setDensityOverride: (density) => set({ densityOverride: density }),
}));
