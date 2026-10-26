import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAgenticShell } from "@/stores/agentic-shell.store";

const COMMANDS = [
	{ label: "Ir a cierre mensual", action: "/workspace/1/2026/3/close" },
	{ label: "Ir a conciliaciones", action: "/workspace/1/2026/3/reconcile" },
	{ label: "Ir a facturación", action: "/workspace/1/2026/3/review" },
	{ label: "Ir a cumplimiento", action: "/workspace/1/2026/3/submission" },
];

/**
 * CommandPalette — global command palette for quick navigation.
 * Toggled via Cmd+K or the AgenticCommandBar.
 */
export function CommandPalette() {
	const { isCommandPaletteOpen, closeCommandPalette } = useAgenticShell();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isCommandPaletteOpen) {
			inputRef.current?.focus();
		}
	}, [isCommandPaletteOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isCommandPaletteOpen) {
				closeCommandPalette();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isCommandPaletteOpen, closeCommandPalette]);

	if (!isCommandPaletteOpen) return null;

	const handleSelect = (path: string) => {
		window.location.href = path;
		closeCommandPalette();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/60"
				onClick={closeCommandPalette}
				aria-label="Cerrar paleta de comandos"
			/>

			{/* Palette */}
			<div className="relative w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-card shadow-2xl">
				<div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5">
					<Search size={14} className="text-muted-foreground" />
					<input
						ref={inputRef}
						type="text"
						placeholder="Comandos y navegación…"
						className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
					/>
					<span className="rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-[9px] text-muted-foreground">
						ESC
					</span>
				</div>

				<div className="p-2">
					{COMMANDS.map((cmd) => (
						<button
							key={cmd.action}
							type="button"
							onClick={() => handleSelect(cmd.action)}
							className="w-full rounded-lg px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-muted hover:text-foreground"
						>
							{cmd.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
