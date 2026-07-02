import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface InspectorPanel {
	type: "thread" | "diff" | "agent" | "evidence" | "fiscal";
	id: string;
	title: string;
}

export interface WorkspaceSelection {
	organizationId: string;
	organizationName: string;
	ruc: string;
	period: string;
}

export interface AgenticShellState {
	// Sidebar
	isSidebarCollapsed: boolean;
	isSidebarMobileOpen: boolean;
	toggleSidebar: () => void;
	setSidebarCollapsed: (collapsed: boolean) => void;
	setSidebarMobileOpen: (open: boolean) => void;

	// Right Inspector
	activeInspector: InspectorPanel | null;
	openInspector: (panel: InspectorPanel) => void;
	closeInspector: () => void;

	// Command Palette
	isCommandPaletteOpen: boolean;
	openCommandPalette: () => void;
	closeCommandPalette: () => void;

	// Focus mode
	isFocusMode: boolean;
	setFocusMode: (focus: boolean) => void;

	// Workspace
	workspace: WorkspaceSelection | null;
	setWorkspace: (ws: WorkspaceSelection) => void;
}

export const useAgenticShell = create<AgenticShellState>()(
	persist(
		(set) => ({
			// Sidebar
			isSidebarCollapsed: false,
			isSidebarMobileOpen: false,
			toggleSidebar: () =>
				set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
			setSidebarCollapsed: (collapsed) =>
				set({ isSidebarCollapsed: collapsed }),
			setSidebarMobileOpen: (open) => set({ isSidebarMobileOpen: open }),

			// Inspector
			activeInspector: null,
			openInspector: (panel) => set({ activeInspector: panel }),
			closeInspector: () => set({ activeInspector: null }),

			// Command Palette
			isCommandPaletteOpen: false,
			openCommandPalette: () => set({ isCommandPaletteOpen: true }),
			closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

			// Focus mode
			isFocusMode: false,
			setFocusMode: (focus) => set({ isFocusMode: focus }),

			// Workspace
			workspace: null,
			setWorkspace: (ws) => set({ workspace: ws }),
		}),
		{
			name: "agentic-shell",
			partialize: (state) => ({
				isSidebarCollapsed: state.isSidebarCollapsed,
				isFocusMode: state.isFocusMode,
			}),
		},
	),
);
