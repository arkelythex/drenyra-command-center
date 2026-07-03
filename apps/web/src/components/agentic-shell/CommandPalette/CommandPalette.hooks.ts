import { useEffect, useState } from "react";

/**
 * Hook for command palette keyboard navigation.
 * Handles arrow keys, enter, and escape within the palette.
 */
export function usePaletteKeyboard({
	isOpen,
	filteredCount,
	onSelect,
	onClose,
}: {
	isOpen: boolean;
	filteredCount: number;
	onSelect: (index: number) => void;
	onClose: () => void;
}) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Reset selection when filters change
	useEffect(() => {
		setSelectedIndex(0);
	}, [filteredCount]);

	useEffect(() => {
		if (!isOpen) return;

		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % filteredCount);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) => (prev - 1 + filteredCount) % filteredCount);
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (filteredCount > 0) {
					onSelect(selectedIndex);
				}
			} else if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		};

		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [isOpen, filteredCount, selectedIndex, onSelect, onClose]);

	return { selectedIndex, setSelectedIndex };
}
