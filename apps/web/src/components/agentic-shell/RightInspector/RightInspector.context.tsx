import { createContext, useContext } from "react";
import type { InspectorPanelId } from "./RightInspector.types";

interface InspectorContextValue {
	activePanel: InspectorPanelId | null;
	openPanel: (panel: InspectorPanelId) => void;
	closePanel: () => void;
	isPinned: boolean;
	togglePin: () => void;
}

export const InspectorContext = createContext<InspectorContextValue | null>(
	null,
);

export function useInspector(): InspectorContextValue {
	const ctx = useContext(InspectorContext);
	if (!ctx)
		throw new Error("useInspector must be used within InspectorProvider");
	return ctx;
}
