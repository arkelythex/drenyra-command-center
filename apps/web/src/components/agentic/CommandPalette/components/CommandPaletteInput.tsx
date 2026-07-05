import { Command } from "cmdk";

interface CommandPaletteInputProps {
	placeholder?: string;
}

export function CommandPaletteInput({
	placeholder = "¿Qué necesitas hacer?",
}: CommandPaletteInputProps) {
	return <Command.Input placeholder={placeholder} />;
}
