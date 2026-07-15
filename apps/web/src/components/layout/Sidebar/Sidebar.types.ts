import type { LucideIcon, type LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

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

export interface SidebarSection {
	id: string;
	label: string;
	collapsible: boolean;
	defaultCollapsed?: boolean;
	items: {
		icon: ForwardRefExoticComponent<
			Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
		>;
		label: string;
		to: string;
	}[];
}
