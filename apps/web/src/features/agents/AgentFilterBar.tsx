import { useAgentsWindowStore } from "./agents.store";

export function AgentFilterBar() {
	const filters = useAgentsWindowStore((s) => s.filters);
	const setFilters = useAgentsWindowStore((s) => s.setFilters);
	const resetFilters = useAgentsWindowStore((s) => s.resetFilters);

	const hasActiveFilters =
		filters.client ||
		filters.period ||
		filters.status ||
		filters.risk ||
		filters.agentType;

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				<input
					type="text"
					placeholder="Cliente…"
					value={filters.client ?? ""}
					onChange={(e) => setFilters({ client: e.target.value || undefined })}
					className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--color-primary)]"
				/>
				<input
					type="month"
					value={filters.period ?? ""}
					onChange={(e) =>
						setFilters({ period: e.target.value || undefined })
					}
					className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
				/>
				<select
					value={filters.status ?? ""}
					onChange={(e) =>
						setFilters({ status: e.target.value || undefined })
					}
					className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
				>
					<option value="">Todos</option>
					<option value="running">En ejecución</option>
					<option value="paused">Pausado</option>
					<option value="completed">Completado</option>
					<option value="failed">Fallido</option>
					<option value="awaiting_approval">Espera aprobación</option>
				</select>
				<select
					value={filters.risk ?? ""}
					onChange={(e) =>
						setFilters({ risk: e.target.value || undefined })
					}
					className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
				>
					<option value="">Todos</option>
					<option value="low">Bajo</option>
					<option value="medium">Medio</option>
					<option value="high">Alto</option>
					<option value="critical">Crítico</option>
				</select>
				<select
					value={filters.agentType ?? ""}
					onChange={(e) =>
						setFilters({ agentType: e.target.value || undefined })
					}
					className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
				>
					<option value="">Todos</option>
					<option value="cerno">Cerno</option>
					<option value="custos">Custos</option>
					<option value="necto">Necto</option>
					<option value="regula">Regula</option>
					<option value="lumen">Lumen</option>
					<option value="fusio">Fusio</option>
					<option value="scripta">Scripta</option>
					<option value="capsa">Capsa</option>
				</select>
			</div>
			{hasActiveFilters && (
				<div className="flex flex-wrap items-center gap-2">
					{filters.client && (
						<span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs text-[var(--color-primary)]">
							Cliente: {filters.client}
						</span>
					)}
					{filters.period && (
						<span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs text-[var(--color-primary)]">
							Período: {filters.period}
						</span>
					)}
					{filters.status && (
						<span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs text-[var(--color-primary)]">
							Estado: {filters.status}
						</span>
					)}
					<button
						type="button"
						onClick={resetFilters}
						className="text-xs text-[var(--text-secondary)] underline transition-colors hover:text-[var(--text-primary)]"
					>
						Limpiar
					</button>
				</div>
			)}
		</div>
	);
}
