import { useEffect, useCallback, useState, useMemo } from "react";
import type {
	CommandCategory,
	CommandPaletteCommand,
} from "./CommandPalette.types";

export function useCommandPalette(
	isOpen: boolean,
	onClose: () => void,
	categories: CommandCategory[],
) {
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const filtered = useMemo(() => {
		if (!query.trim()) return categories;
		const q = query.toLowerCase();
		return categories
			.map((cat) => ({
				...cat,
				commands: cat.commands.filter(
					(cmd) =>
						cmd.label.toLowerCase().includes(q) ||
						cmd.description.toLowerCase().includes(q) ||
						cmd.keywords.some((k) => k.includes(q)),
				),
			}))
			.filter((cat) => cat.commands.length > 0);
	}, [query, categories]);

	const flatCommands = useMemo(
		() => filtered.flatMap((cat) => cat.commands),
		[filtered],
	);

	const execute = useCallback(
		(command: CommandPaletteCommand) => {
			command.action();
			onClose();
			setQuery("");
		},
		[onClose],
	);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((i) => Math.max(i - 1, 0));
					break;
				case "Enter":
					e.preventDefault();
					if (flatCommands[selectedIndex]) {
						execute(flatCommands[selectedIndex]);
					}
					break;
				case "Escape":
					e.preventDefault();
					onClose();
					setQuery("");
					break;
			}
		},
		[flatCommands, selectedIndex, execute, onClose],
	);

	useEffect(() => {
		if (!isOpen) {
			setQuery("");
			setSelectedIndex(0);
		}
	}, [isOpen]);

	return {
		query,
		setQuery,
		filtered,
		selectedIndex,
		flatCommands,
		execute,
		onKeyDown,
	};
}

export function usePaletteKeyboard(onOpen: () => void) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				onOpen();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onOpen]);
}
