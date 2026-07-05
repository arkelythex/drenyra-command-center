import { type KeyboardEvent, useEffect, useState } from "react";
import type { CommandSuggestion } from "../components/input/unified-input.types";
import { getCommandSuggestions } from "../logic/intent-parser";

interface UseCommandSuggestionsResult {
	suggestions: CommandSuggestion[];
	selectedIndex: number;
	clearSuggestions: () => void;
	handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
	resetSelection: () => void;
	setSelectedIndex: (index: number) => void;
	takeSelectedCommand: () => string | null;
}

export function useCommandSuggestions(
	value: string,
): UseCommandSuggestionsResult {
	const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(-1);

	useEffect(() => {
		if (!value.startsWith("/")) {
			setSuggestions([]);
			setSelectedIndex(-1);
			return;
		}

		const filteredSuggestions = getCommandSuggestions(value);
		setSuggestions(filteredSuggestions);
		setSelectedIndex(filteredSuggestions.length > 0 ? 0 : -1);
	}, [value]);

	const clearSuggestions = () => {
		setSuggestions([]);
		setSelectedIndex(-1);
	};

	const resetSelection = () => {
		setSelectedIndex(-1);
	};

	const takeSelectedCommand = () => {
		if (selectedIndex < 0) {
			return null;
		}

		return suggestions[selectedIndex]?.command ?? null;
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (suggestions.length === 0) {
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setSelectedIndex(
				(previousIndex) => (previousIndex + 1) % suggestions.length,
			);
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setSelectedIndex(
				(previousIndex) =>
					(previousIndex - 1 + suggestions.length) % suggestions.length,
			);
			return;
		}

		if (event.key === "Escape") {
			clearSuggestions();
		}
	};

	return {
		suggestions,
		selectedIndex,
		clearSuggestions,
		handleKeyDown,
		resetSelection,
		setSelectedIndex,
		takeSelectedCommand,
	};
}
