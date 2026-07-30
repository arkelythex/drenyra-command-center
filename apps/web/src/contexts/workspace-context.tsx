import { createContext, useContext, type ReactNode } from "react";
import { useWorkspaceStore } from "../stores/workspace.store";

// ─── Context value ───────────────────────────────────────────────────────────

export interface WorkspaceContextValue {
	activePanelId: string | null;
	setActivePanel: (id: string | null) => void;
	isReady: boolean;
	updateLayout: WorkspaceUIState["updateLayout"];
	resetLayout: WorkspaceUIState["resetLayout"];
	setDensityOverride: WorkspaceUIState["setDensityOverride"];
}

import type { WorkspaceUIState } from "../stores/workspace.store";

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const activePanelId = useWorkspaceStore((s) => s.activePanelId);
	const setActivePanel = useWorkspaceStore((s) => s.setActivePanel);
	const isReady = useWorkspaceStore((s) => s.isReady);
	const updateLayout = useWorkspaceStore((s) => s.updateLayout);
	const resetLayout = useWorkspaceStore((s) => s.resetLayout);
	const setDensityOverride = useWorkspaceStore((s) => s.setDensityOverride);

	return (
		<WorkspaceContext.Provider
			value={{
				activePanelId,
				setActivePanel,
				isReady,
				updateLayout,
				resetLayout,
				setDensityOverride,
			}}
		>
			{children}
		</WorkspaceContext.Provider>
	);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextValue {
	const ctx = useContext(WorkspaceContext);
	if (!ctx) {
		throw new Error("useWorkspace must be used within a WorkspaceProvider");
	}
	return ctx;
}
