import type { ComponentType } from "react";

export interface CommandItemBase {
	id: string;
	label: string;
	description: string;
	icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

export interface NavTarget extends CommandItemBase {
	path: string;
}

export interface ActionItem extends CommandItemBase {
	action: () => void;
}
