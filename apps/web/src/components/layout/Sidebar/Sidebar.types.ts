import type { LucideIcon } from "lucide-react";

export interface SidebarProps {
	isCollapsed: boolean;
	onToggle: () => void;
	onNavigate: () => void;
}

export interface NavItem {
	icon: LucideIcon;
	label: string;
	to: string;
}
