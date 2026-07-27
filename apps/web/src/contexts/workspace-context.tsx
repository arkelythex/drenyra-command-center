import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Workspace } from "@drenyra/domain";
import { announce } from "../components/workbench/ScreenReaderAnnouncer";
import type { WorkspaceStore } from "../stores/workspace.store";
import { useWorkspaceStore } from "../stores/workspace.store";

// ─── Context value ────────────────────────────────────────────────────────────

export interface WorkspaceContextValue {
	workspace: Workspace | null;
	isLoading: boolean;
	navigateTo: WorkspaceStore["navigateTo"];
	switchIntent: WorkspaceStore["switchIntent"];
	switchCompany: WorkspaceStore["switchCompany"];
	switchPeriod: WorkspaceStore["switchPeriod"];
	updateLayout: WorkspaceStore["updateLayout"];
	resetLayout: WorkspaceStore["resetLayout"];
	setDensity: WorkspaceStore["setDensity"];
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const current = useWorkspaceStore((s) => s.current);

	// Announce workspace changes for screen readers
	useEffect(() => {
		if (current) {
			announce(
				`Workspace: ${current.company.name}, ${current.period.label}, ${current.intent}`,
				"polite",
			);
		}
	}, [current]);
	const isLoading = useWorkspaceStore((s) => s.isLoading);
	const navigateTo = useWorkspaceStore((s) => s.navigateTo);
	const switchIntent = useWorkspaceStore((s) => s.switchIntent);
	const switchCompany = useWorkspaceStore((s) => s.switchCompany);
	const switchPeriod = useWorkspaceStore((s) => s.switchPeriod);
	const updateLayout = useWorkspaceStore((s) => s.updateLayout);
	const resetLayout = useWorkspaceStore((s) => s.resetLayout);
	const setDensity = useWorkspaceStore((s) => s.setDensity);

	return (
		<WorkspaceContext.Provider
			value={{
				workspace: current,
				isLoading,
				navigateTo,
				switchIntent,
				switchCompany,
				switchPeriod,
				updateLayout,
				resetLayout,
				setDensity,
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
