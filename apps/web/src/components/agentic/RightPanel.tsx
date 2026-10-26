import { X } from "lucide-react";
import { useAgenticShell } from "@/stores/agentic-shell.store";

/**
 * RightPanel — right-side inspector panel for evidence, threads, diffs, agents.
 * Controlled by agentic-shell store. Shows based on activeInspector type.
 */
export function RightPanel() {
	const { activeInspector, closeInspector } = useAgenticShell();

	if (!activeInspector) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<p className="text-xs text-muted-foreground">
					Selecciona un elemento para inspeccionar
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2.5">
				<span className="text-xs font-semibold text-foreground">
					{activeInspector.title}
				</span>
				<button
					type="button"
					onClick={closeInspector}
					className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Cerrar panel"
				>
					<X size={14} />
				</button>
			</div>

			{/* Content area */}
			<div className="flex-1 overflow-y-auto p-3">
				<div className="space-y-3">
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-[var(--text-secondary)]">
							Tipo:
						</span>{" "}
						{activeInspector.type}
					</p>
					<p className="text-xs text-muted-foreground">
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
