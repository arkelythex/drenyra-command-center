import { useEffect } from "react";

interface UseSheetDiffHotkeysInput {
	enabled: boolean;
	onAccept: () => void;
}

export function useSheetDiffHotkeys({
	enabled,
	onAccept,
}: UseSheetDiffHotkeysInput) {
	useEffect(() => {
		if (!enabled) return;

		const onKeyDown = (event: KeyboardEvent) => {
			const isEnter = event.key === "Enter";
			const hasModifier = event.ctrlKey || event.metaKey;
			if (!isEnter || !hasModifier) return;
			event.preventDefault();
			onAccept();
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [enabled, onAccept]);
}
