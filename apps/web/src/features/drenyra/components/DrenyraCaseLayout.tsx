/**
 * DrenyraCaseLayout — contenido del caso de trabajo.
 *
 * Se renderiza DENTRO del CodexShell (que ya provee header + sidebar + right panel).
 * Por eso NO incluye AccountingTopBar ni layout propio — solo el contenido útil.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  (AccountingTopBar — viene de CodexShell)                │
 * ├──────────────────────────────────────────────────────────┤
 * │  Toolbar: [Editor de asientos]           [🧩] [🪟]      │
 * ├──────────────────────────────────────────────────────────┤
 * │  Journal editor (children)                               │
 * │                                                          │
 * ├──────────────────────────────────────────────────────────┤
 * │  Terminal del agente (opcional, toggle)                  │
 * └──────────────────────────────────────────────────────────┘
 */

import { Eye, Terminal } from "lucide-react";
import { lazy, type ReactNode, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const TerminalShell = lazy(() =>
	import("@/components/agentic/TerminalShell").then((m) => ({
		default: m.TerminalShell,
	})),
);

interface DrenyraCaseLayoutProps {
	children?: ReactNode;
}

export function DrenyraCaseLayout({ children }: DrenyraCaseLayoutProps) {
	const terminalOpen = useUIStore((s) => s.terminalOpen);
	const toggleTerminal = useUIStore((s) => s.toggleTerminal);
	const toggleRightPanel = useUIStore((s) => s.toggleRightRail);

	return (
		<div className="flex h-full w-full flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans">
			{/* Toolbar */}
			<div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
				<span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
					Editor de asientos
				</span>
				<div className="flex-1" />
				<button
					type="button"
					onClick={toggleTerminal}
					className={cn(
						"rounded-lg p-1.5 transition-colors",
						terminalOpen
							? "text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10"
							: "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
					)}
					aria-label="Abrir terminal del agente"
				>
					<Terminal size={16} strokeWidth={2} />
				</button>
				<button
					type="button"
					onClick={toggleRightPanel}
					className={cn(
						"rounded-lg p-1.5 transition-colors",
						"text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
					)}
					aria-label="Abrir panel de detalles"
				>
					<Eye size={16} strokeWidth={2} />
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto custom-scrollbar">
				<Suspense fallback={null}>{children}</Suspense>
			</div>

			{/* Terminal del agente */}
			{terminalOpen && (
				<div className="border-t border-[var(--border-subtle)]">
					<div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-1)] border-b border-[var(--border-subtle)]">
						<h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
							Terminal del agente
						</h3>
						<button
							type="button"
							onClick={toggleTerminal}
							className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
						>
							Cerrar
						</button>
					</div>
					<div className="h-[200px] overflow-y-auto">
						<Suspense
							fallback={
								<div className="flex items-center justify-center h-full text-sm text-[var(--text-tertiary)]">
									Cargando terminal...
								</div>
							}
						>
							<TerminalShell />
						</Suspense>
					</div>
				</div>
			)}
		</div>
	);
}
