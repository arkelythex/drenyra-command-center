import { Bot } from "lucide-react";

export function EmptyState() {
	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center">
				<Bot size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
				<p className="text-sm font-medium text-[var(--text-secondary)]">
					No hay asientos propuestos
				</p>
				<p className="mt-1 text-xs text-[var(--text-muted)]">
					Los agentes mostrarán aquí los asientos contables para tu revisión
				</p>
			</div>
		</div>
	);
}
