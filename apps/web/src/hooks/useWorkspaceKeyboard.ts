import { useEffect } from "react";
import { useUIStore } from "../store/ui-store";
import { useAgenticShell } from "../stores/agentic-shell.store";

interface KeyboardShortcut {
	key: string;
	metaKey?: boolean;
	ctrlKey?: boolean;
	shiftKey?: boolean;
	altKey?: boolean;
	handler: () => void;
	/** If true, the shortcut is disabled when an input/textarea is focused */
	disableWhenInputFocused?: boolean;
}

/**
 * useWorkspaceKeyboard — global keyboard model for the Workbench.
 *
 * All global shortcuts are registered here.
 * Shortcuts are disabled when an input element is focused (unless bypassed).
 */
export function useWorkspaceKeyboard() {
	const toggleSidebar = useAgenticShell((s) => s.toggleSidebar);
	const toggleRightRail = useUIStore((s) => s.toggleRightRail);
	const toggleTerminal = useUIStore((s) => s.toggleTerminal);
	const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

	useEffect(() => {
		const isInputFocused = (): boolean => {
			const active = document.activeElement;
			if (!active) return false;
			const tag = active.tagName.toLowerCase();
			return (
				tag === "input" ||
				tag === "textarea" ||
				tag === "select" ||
				(active as HTMLElement).contentEditable === "true" ||
				active.getAttribute("role") === "textbox"
			);
		};

		const shortcuts: KeyboardShortcut[] = [
			// ⌘K / Ctrl+K — Open command palette
			{
				key: "k",
				metaKey: true,
				handler: () => setCommandPaletteOpen((prev) => !prev),
				disableWhenInputFocused: false, // Always works
			},
			// ⌘B / Ctrl+B — Toggle sidebar
			{
				key: "b",
				metaKey: true,
				handler: toggleSidebar,
				disableWhenInputFocused: true,
			},
			// ⌘\ / Ctrl+\ — Toggle right panel
			{
				key: "\\",
				metaKey: true,
				handler: toggleRightRail,
				disableWhenInputFocused: true,
			},
			// ⌘` / Ctrl+` — Toggle terminal
			{
				key: "`",
				metaKey: true,
				handler: toggleTerminal,
				disableWhenInputFocused: true,
			},
			// Esc — Close overlays
			{
				key: "Escape",
				handler: () => {
					const paletteOpen = useUIStore.getState().commandPaletteOpen;
					if (paletteOpen) {
						setCommandPaletteOpen(false);
					}
				},
				disableWhenInputFocused: false,
			},
			// ⌘, — Settings
			{
				key: ",",
				metaKey: true,
				handler: () => {
					window.dispatchEvent(
						new KeyboardEvent("keydown", {
							key: ",",
							metaKey: true,
						}),
					);
				},
				disableWhenInputFocused: true,
			},
		];

		const matchesShortcut = (e: KeyboardEvent, s: KeyboardShortcut): boolean =>
			e.key.toLowerCase() === s.key.toLowerCase() &&
			(s.metaKey ? e.metaKey : !e.metaKey) &&
			(s.ctrlKey ? e.ctrlKey : !e.ctrlKey) &&
			(s.shiftKey ? e.shiftKey : !e.shiftKey) &&
			(s.altKey ? e.altKey : !e.altKey);

		const handleKeyDown = (e: KeyboardEvent) => {
			for (const shortcut of shortcuts) {
				if (!matchesShortcut(e, shortcut)) continue;

				const hasModifier = Boolean(shortcut.metaKey || shortcut.ctrlKey);
				const shouldBlock =
					!hasModifier &&
					shortcut.disableWhenInputFocused !== false &&
					isInputFocused();

				if (shouldBlock) return;

				e.preventDefault();
				shortcut.handler();
				return;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [toggleSidebar, toggleRightRail, toggleTerminal, setCommandPaletteOpen]);
}
