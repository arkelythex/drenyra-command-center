import type { LucideIcon } from "lucide-react";

export type NavSectionId = "work" | "parties" | "system";

export interface AgenticSidebarProps {
	isCollapsed?: boolean;
}

export interface AgenticNavItem {
	id: string;
	section: NavSectionId;
	label: string;
	description: string;
	to: string;
	icon: LucideIcon;
	badge?: number | string;
}

export interface NavSectionConfig {
	title: string;
	items: AgenticNavItem[];
}
