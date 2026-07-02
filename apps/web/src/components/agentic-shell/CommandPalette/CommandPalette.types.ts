import type { LucideIcon } from "lucide-react";

export type CommandCategory = "recent" | "navigation" | "action" | "agent";

export interface PaletteCommand {
	id: string;
	label: string;
	description?: string;
	icon: LucideIcon;
	category: CommandCategory;
	shortcut?: string;
	action: () => void;
	keywords?: string[];
}
