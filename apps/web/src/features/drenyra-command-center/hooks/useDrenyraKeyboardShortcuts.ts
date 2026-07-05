import { useEffect } from "react";
import type { DensityMode } from "../components/ArtifactCollapsible";

interface UseDrenyraKeyboardShortcutsOptions {
	showPalette: boolean;
	setShowPalette: (value: boolean | ((prev: boolean) => boolean)) => void;
	showSearch: boolean;
	setShowSearch: (value: boolean | ((prev: boolean) => boolean)) => void;
	showSettings: boolean;
	setShowSettings: (value: boolean | ((prev: boolean) => boolean)) => void;
	showShortcuts: boolean;
	setShowShortcuts: (value: boolean | ((prev: boolean) => boolean)) => void;
	activeCaseId: string | null;
	startRun: { mutate: () => void };
}

export function useDrenyraKeyboardShortcuts({
	showPalette,
	setShowPalette,
	showSearch,
	setShowSearch,
	showSettings,
	setShowSettings,
	showShortcuts,
	setShowShortcuts,
	activeCaseId,
	startRun,
}: UseDrenyraKeyboardShortcutsOptions) {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				if (showSearch) {
					setShowSearch(false);
					return;
				}
				if (showSettings) {
					setShowSettings(false);
					return;
				}
				if (showShortcuts) {
					setShowShortcuts(false);
					return;
				}
				if (showPalette) {
					setShowPalette(false);
					return;
				}
			}

			if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setShowPalette((prev) => !prev);
				return;
			}

			if (event.key === "f" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setShowSearch((prev) => !prev);
				setShowPalette(false);
				return;
			}

			if (event.key === "," && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setShowSettings((prev) => !prev);
				setShowPalette(false);
				return;
			}

			if (event.key === "/" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setShowShortcuts((prev) => !prev);
				setShowPalette(false);
				return;
			}

			if (
				event.key === "n" &&
				(event.metaKey || event.ctrlKey) &&
				!event.shiftKey
			) {
				event.preventDefault();
				const btn = document.querySelector('[data-action="new-case"]');
				if (btn instanceof HTMLElement) btn.click();
			}

			if (
				event.key === "r" &&
				(event.metaKey || event.ctrlKey) &&
				!event.shiftKey
			) {
				event.preventDefault();
				if (activeCaseId) startRun.mutate();
			}

			if (
				event.key === "u" &&
				(event.metaKey || event.ctrlKey) &&
				!event.shiftKey
			) {
				event.preventDefault();
				const uploadBtn = document.querySelector(
					'[data-action="upload-evidence"]',
				);
				if (uploadBtn instanceof HTMLElement) uploadBtn.click();
			}

			if (
				event.key === "c" &&
				(event.metaKey || event.ctrlKey) &&
				event.shiftKey
			) {
				event.preventDefault();
				window.dispatchEvent(new CustomEvent("drenyra:clear-chat"));
			}

			if (
				(event.metaKey || event.ctrlKey) &&
				!event.shiftKey &&
				["1", "2", "3"].includes(event.key)
			) {
				event.preventDefault();
				const densityMap: Record<string, DensityMode> = {
					"1": "compact",
					"2": "detail",
					"3": "numbers-only",
				};
				window.dispatchEvent(
					new CustomEvent("drenyra:density-change", {
						detail: densityMap[event.key],
					}),
				);
			}
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [
		showPalette,
		showSearch,
		showSettings,
		showShortcuts,
		activeCaseId,
		startRun,
		setShowPalette,
		setShowSearch,
		setShowSettings,
		setShowShortcuts,
	]);
}
