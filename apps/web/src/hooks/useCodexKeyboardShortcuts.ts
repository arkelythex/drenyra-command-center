import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { useUIStore } from "@/store/ui-store";
import { useThreadStore } from "@/stores/thread-store";

function isInputFocused() {
	const tag = document.activeElement?.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA") return true;
	if ((document.activeElement as HTMLElement | null)?.isContentEditable)
		return true;
	return false;
}

export function useCodexKeyboardShortcuts() {
	const navigate = useNavigate();
	const toggleSidebar = useUIStore((s) => s.toggleSidebar);
	const toggleRightPanel = useUIStore((s) => s.toggleRightRail);
	const toggleTerminal = useUIStore((s) => s.toggleTerminal);
	const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

	const handleEscape = useCallback(() => {
		const uiState = useUIStore.getState();
		if (uiState.terminalOpen) {
			uiState.toggleTerminal();
		} else if (uiState.isRightRailOpen) {
			uiState.toggleRightRail();
		} else if (uiState.isSidebarOpen) {
			uiState.toggleSidebar();
		}
	}, []);

	const focusComposer = useCallback(() => {
		const textarea = document.querySelector<HTMLTextAreaElement>(
			'[data-composer="true"]',
		);
		textarea?.focus();
	}, []);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				e.preventDefault();
				handleEscape();
				return;
			}

			const mod = e.metaKey || e.ctrlKey;
			if (!mod) return;

			if (e.key === "l") {
				e.preventDefault();
				focusComposer();
				return;
			}

			if (isInputFocused()) return;

			if (e.key === "b") {
				if (e.shiftKey) {
					e.preventDefault();
					toggleRightPanel();
				} else {
					e.preventDefault();
					toggleSidebar();
				}
				return;
			}

			if (e.key === "j") {
				e.preventDefault();
				toggleTerminal();
				return;
			}

			if (e.key === "l") {
				e.preventDefault();
				focusComposer();
				return;
			}

			if (e.key === ",") {
				e.preventDefault();
				navigate({ to: "/configuracion" });
				return;
			}

			if (e.key === "d") {
				e.preventDefault();
				navigate({ to: "/dashboard" });
				return;
			}

			if (e.key === "t" && e.shiftKey) {
				const state = useThreadStore.getState();
				const archived = state.threads.filter((t) => t.status === "archived");
				if (archived.length > 0) {
					const mostRecent = archived.reduce((a, b) =>
						a.updatedAt > b.updatedAt ? a : b,
					);
					e.preventDefault();
					state.unarchiveThread(mostRecent.id);
				}
				return;
			}

			if (e.key === "p") {
				e.preventDefault();
				setCommandPaletteOpen(true);
				return;
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		toggleSidebar,
		toggleRightPanel,
		toggleTerminal,
		handleEscape,
		focusComposer,
		navigate,
		setCommandPaletteOpen,
	]);
}
