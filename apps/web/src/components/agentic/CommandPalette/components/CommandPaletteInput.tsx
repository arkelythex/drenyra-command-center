import { Command } from "cmdk";

interface CommandPaletteInputProps {
	placeholder?: string;
}

export function CommandPaletteInput({
	placeholder = "Buscar comandos fiscales: @facturas, @banco, @SUNAT…",
}: CommandPaletteInputProps) {
	return <Command.Input placeholder={placeholder} />;
}
