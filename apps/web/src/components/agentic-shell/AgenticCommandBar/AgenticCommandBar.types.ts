import type { LucideIcon } from "lucide-react";

export interface AgenticCommandBarProps {
	className?: string;
}

export interface QuickReference {
	prefix: "@";
	label: string;
	description: string;
	icon?: LucideIcon;
	action: () => void;
}

export interface SkillCommand {
	prefix: "/";
	label: string;
	description: string;
	icon?: LucideIcon;
	action: () => void;
}

export type CommandSuggestion = QuickReference | SkillCommand;
