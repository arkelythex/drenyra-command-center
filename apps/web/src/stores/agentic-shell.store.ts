import { create } from "zustand";

export type InspectorPanelType =
	| "evidence"
	| "journal-proposal"
	| "reconciliation"
	| "invoice"
	| "approval"
	| "fiscal"
	| "agent"
	| "diff"
	| "thread";

export interface InspectorPanel {
	type: InspectorPanelType;
	id: string;
	title: string;
}

interface AgenticShellState {
	// Sidebar
	isSidebarCollapsed: boolean;
	isSidebarMobileOpen: boolean;
	toggleSidebarCollapsed: () => void;
	setSidebarCollapsed: (collapsed: boolean) => void;
	setSidebarMobileOpen: (open: boolean) => void;

	// Right inspector
	activeInspector: InspectorPanel | null;
	openInspector: (panel: InspectorPanel) => void;
	closeInspector: () => void;

	// Command palette
	isCommandPaletteOpen: boolean;
	openCommandPalette: () => void;
	closeCommandPalette: () => void;

	// Focus mode
	isFocusMode: boolean;
	setFocusMode: (focus: boolean) => void;
}

export const useAgenticShell = create<AgenticShellState>()((set) => ({
	isSidebarCollapsed: false,
	isSidebarMobileOpen: false,
	toggleSidebarCollapsed: () =>
		set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
	setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
	setSidebarMobileOpen: (open) => set({ isSidebarMobileOpen: open }),

	activeInspector: null,
	openInspector: (panel) => set({ activeInspector: panel }),
	closeInspector: () => set({ activeInspector: null }),

	isCommandPaletteOpen: false,
	openCommandPalette: () => set({ isCommandPaletteOpen: true }),
	closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

	isFocusMode: false,
	setFocusMode: (focus) => set({ isFocusMode: focus }),
}));
