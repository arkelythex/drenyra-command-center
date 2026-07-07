import type { ReactNode } from "react";

export interface AgenticLayoutProps {
	children?: ReactNode;
}

export interface InspectorPanel {
	type: "thread" | "diff" | "agent" | "evidence" | "fiscal";
	id: string;
	title: string;
}

export interface WorkspaceSelection {
	organizationId: string;
	companyId: string;
	period: string;
}

export interface AgenticLayoutContextValue {
	workspace: WorkspaceSelection | null;
	setWorkspace: (ws: WorkspaceSelection) => void;
	inspector: InspectorPanel | null;
	openInspector: (panel: InspectorPanel) => void;
	closeInspector: () => void;
	isCommandPaletteOpen: boolean;
	openCommandPalette: () => void;
	closeCommandPalette: () => void;
}
