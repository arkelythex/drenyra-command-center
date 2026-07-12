import type { ReactNode } from "react";

export type InspectorPanelId =
	| "thread"
	| "diff"
	| "agent"
	| "evidence"
	| "fiscal";

export type InspectorPanelConfig = {
	id: InspectorPanelId;
	label: string;
	icon?: string;
	component: ReactNode;
};

export type RightInspectorProps = {
	isOpen: boolean;
	activePanel: InspectorPanelId | null;
	panels: InspectorPanelConfig[];
	onClose: () => void;
	onPin: () => void;
};
