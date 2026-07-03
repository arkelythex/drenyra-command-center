"use client";

import { createContext, useContext, useCallback } from "react";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import type {
	AgenticLayoutContextValue,
	InspectorPanel,
	WorkspaceSelection,
} from "./AgenticLayout.types";

const AgenticLayoutContext = createContext<AgenticLayoutContextValue | null>(
	null,
);

export function AgenticLayoutProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const store = useAgenticShell();

	const openInspector = useCallback(
		(panel: InspectorPanel) => store.openInspector(panel),
		[store.openInspector],
	);
	const closeInspector = useCallback(
		() => store.closeInspector(),
		[store.closeInspector],
	);
	const setWorkspace = useCallback(
		(ws: WorkspaceSelection) => store.setWorkspace(ws),
		[store.setWorkspace],
	);

	const value: AgenticLayoutContextValue = {
		activeInspector: store.activeInspector,
		openInspector,
		closeInspector,
		workspace: store.workspace,
		setWorkspace,
		isCommandPaletteOpen: store.isCommandPaletteOpen,
		openCommandPalette: store.openCommandPalette,
		closeCommandPalette: store.closeCommandPalette,
	};

	return (
		<AgenticLayoutContext.Provider value={value}>
			{children}
		</AgenticLayoutContext.Provider>
	);
}

export function useAgenticLayout(): AgenticLayoutContextValue {
	const ctx = useContext(AgenticLayoutContext);
	if (!ctx) {
		throw new Error(
			"useAgenticLayout must be used within an AgenticLayoutProvider",
		);
	}
	return ctx;
}
