export type CommandPaletteCommand = {
	id: string;
	label: string;
	description: string;
	category: "navigation" | "action" | "agent" | "recent";
	icon?: string;
	action: () => void;
	keywords: string[];
};

export type CommandCategory = {
	id: string;
	label: string;
	commands: CommandPaletteCommand[];
};

export type CommandPaletteProps = {
	isOpen: boolean;
	onClose: () => void;
	registry: CommandCategory[];
};
