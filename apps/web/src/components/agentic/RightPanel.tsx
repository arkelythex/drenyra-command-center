import { useAgenticShell } from "@/stores/agentic-shell.store";
import { X } from "lucide-react";

/**
 * RightPanel — right-side inspector panel for evidence, threads, diffs, agents.
 * Controlled by agentic-shell store. Shows based on activeInspector type.
 */
export function RightPanel() {
	const { activeInspector, closeInspector } = useAgenticShell();

	if (!activeInspector) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<p className="text-xs text-[var(--text-muted)]">
					Selecciona un elemento para inspeccionar
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2.5">
				<span className="text-xs font-semibold text-[var(--text-primary)]">
					{activeInspector.title}
				</span>
				<button
					type="button"
					onClick={closeInspector}
					className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					aria-label="Cerrar panel"
				>
					<X size={14} />
				</button>
			</div>

			{/* Content area */}
			<div className="flex-1 overflow-y-auto p-3">
				<div className="space-y-3">
					<p className="text-xs text-[var(--text-muted)]">
						<span className="font-medium text-[var(--text-secondary)]">
							Tipo:
						</span>{" "}
						{activeInspector.type}
					</p>
					<p className="text-xs text-[var(--text-muted)]">
						<span className="font-medium text-[var(--text-secondary)]">
							ID:
						</span>{" "}
						{activeInspector.id}
					</p>
				</div>
			</div>
		</div>
	);
}
