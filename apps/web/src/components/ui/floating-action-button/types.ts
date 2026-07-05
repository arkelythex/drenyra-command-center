import type { LucideIcon } from "lucide-react";
import type { AppRoutePath } from "@/lib/router/app-route";

export interface FloatingActionButtonProps {
	onAction: (action: string) => void;
	className?: string;
}

export interface QuickRoute {
	label: string;
	path: AppRoutePath;
	icon: LucideIcon;
}

export interface QuickAction {
	id: string;
	icon: LucideIcon;
	label: string;
	color: string;
}
