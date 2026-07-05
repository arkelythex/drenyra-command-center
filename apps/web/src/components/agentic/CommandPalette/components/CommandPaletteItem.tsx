import { Command } from "cmdk";
import type { ComponentType } from "react";
import { CommandPaletteHotkey } from "./CommandPaletteHotkey";

interface CommandPaletteItemProps {
	value?: string;
	icon: ComponentType<{ size?: number; strokeWidth?: number }>;
	label: string;
	description: string;
	keywords?: string[];
	onSelect: () => void;
	disabled?: boolean;
	hotkeys?: string[];
}

export function CommandPaletteItem({
	value,
	icon: Icon,
	label,
	description,
	keywords,
	onSelect,
	disabled,
	hotkeys,
}: CommandPaletteItemProps) {
	return (
		<Command.Item
			value={value ?? label}
			keywords={keywords}
			onSelect={onSelect}
			disabled={disabled}
		>
			<span className="cmd-item-icon">
				<Icon size={14} strokeWidth={1.5} />
			</span>
			<span className="cmd-item-text">
				<span className="cmd-item-label">{label}</span>
				<span className="cmd-item-description">{description}</span>
			</span>
			{hotkeys && hotkeys.length > 0 && <CommandPaletteHotkey keys={hotkeys} />}
		</Command.Item>
	);
}
