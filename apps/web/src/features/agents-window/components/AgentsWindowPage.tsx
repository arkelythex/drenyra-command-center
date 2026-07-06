import { Grid3X3, LayoutList } from "lucide-react";
import { useAgentsWindow } from "../agents-window.store";
import { AgentCard } from "./AgentCard";

/**
 * AgentsWindowPage — grilla de agentes trabajando en paralelo.
 *
 * Cada card muestra progreso en vivo, estado, riesgo, y métricas.
 * Soporta modo grid (default) y modo tabs.
 */
export function AgentsWindowPage() {
	const sessions = useAgentsWindow((s) => s.sessions);
	const gridMode = useAgentsWindow((s) => s.gridMode);
	const setGridMode = useAgentsWindow((s) => s.setGridMode);
	const filters = useAgentsWindow((s) => s.filters);

	const filtered = sessions.filter((s) => {
		if (filters.status && s.status !== filters.status) return false;
		if (filters.risk && s.risk !== filters.risk) return false;
		if (filters.client && !s.clientName.includes(filters.client)) return false;
		return true;
	});

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
				<div>
					<h2 className="text-sm font-semibold text-[var(--text-primary)]">
						Agents Window
					</h2>
					<p className="text-[10px] text-[var(--text-muted)]">
						{sessions.length} sesiones activas
					</p>
				</div>

				{/* View mode toggle */}
				<div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] p-0.5">
					<button
						type="button"
						onClick={() => setGridMode("grid")}
						className={`rounded-md p-1.5 transition-colors ${
							gridMode === "grid"
								? "bg-[var(--surface-2)] text-[var(--text-primary)]"
								: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
						}`}
					>
						<Grid3X3 size={14} />
					</button>
					<button
						type="button"
						onClick={() => setGridMode("tabs")}
						className={`rounded-md p-1.5 transition-colors ${
							gridMode === "tabs"
								? "bg-[var(--surface-2)] text-[var(--text-primary)]"
								: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
						}`}
					>
						<LayoutList size={14} />
					</button>
				</div>
			</div>

			{/* Filter chips */}
			<div className="flex gap-2 border-b border-[var(--border-subtle)] px-4 py-2">
				{["running", "awaiting-approval", "completed", "failed"].map(
					(status) => (
						<button
							key={status}
							type="button"
							onClick={() =>
								useAgentsWindow.getState().setFilters({
									status: filters.status === status ? undefined : status,
								})
							}
							className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
								filters.status === status
									? "bg-[var(--color-primary)] text-white"
									: "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
							}`}
						>
							{status === "running"
								? "Ejecutando"
								: status === "awaiting-approval"
									? "Requiere aprobación"
									: status === "completed"
										? "Completados"
										: "Fallidos"}
						</button>
					),
				)}
			</div>

			{/* Agent grid */}
			<div className="flex-1 overflow-y-auto p-4">
				{filtered.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<p className="text-xs text-[var(--text-muted)]">
							No hay sesiones de agente activas
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
						{filtered.map((session) => (
							<AgentCard key={session.id} session={session} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
