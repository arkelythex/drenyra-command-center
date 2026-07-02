import type { LucideIcon } from "lucide-react";
import type {
	InspectorPanel,
	WorkspaceSelection,
} from "@/stores/agentic-shell.store";

export type { InspectorPanel, WorkspaceSelection };

/** Props for the top-level AgenticLayout wrapper */
export interface AgenticLayoutProps {
	children: React.ReactNode;
}

/** Context value provided by AgenticLayout */
export interface AgenticLayoutContextValue {
	activeInspector: InspectorPanel | null;
	openInspector: (panel: InspectorPanel) => void;
	closeInspector: () => void;
	workspace: WorkspaceSelection | null;
	setWorkspace: (ws: WorkspaceSelection) => void;
	isCommandPaletteOpen: boolean;
	openCommandPalette: () => void;
	closeCommandPalette: () => void;
}

/** Props shared by all sidebar variants */
export interface AgenticSidebarProps {
	isCollapsed: boolean;
	onToggle: () => void;
	onNavigate: () => void;
	className?: string;
}

/** A single navigation section in the sidebar */
export type AgenticNavSectionId = "workspace" | "platform" | "organization";

export interface AgenticNavItem {
	id: string;
	section: AgenticNavSectionId;
	label: string;
	icon: LucideIcon;
	to: string;
	badge?: number;
	badgeVariant?: "critical" | "warning" | "info";
}

export interface NavSectionConfig {
	id: AgenticNavSectionId;
	label: string;
	items: AgenticNavItem[];
}
