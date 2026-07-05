import { cn } from "@/lib/utils";
import { AutonomyDial } from "../../AutonomyDial";
import type { DiscrepancyScenario } from "../../anomaly/discrepancy-scenario";

interface OperationalContextProps {
	autonomyLevel: number;
	hasPendingApproval: boolean;
	scenario: DiscrepancyScenario | null;
	onAutonomyLevelChange: (level: number) => void;
	onToggleResolvedEvents: () => void;
}

export function OperationalContext({
	autonomyLevel,
	hasPendingApproval,
	scenario,
	onAutonomyLevelChange,
	onToggleResolvedEvents,
}: OperationalContextProps) {
	return (
		<section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 space-y-5">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-[13px] font-bold text-[var(--text-primary)]">
						Memoria Operativa
					</p>
					<p className="mt-1 text-label text-[var(--text-secondary)]">
						Configuración y contexto aplicado al expediente.
					</p>
				</div>
				<button
					onClick={onToggleResolvedEvents}
					className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-label font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
				>
					Ver historial
				</button>
			</div>

			<div className="grid gap-3">
				<article className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<p className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Nivel de Supervisión
					</p>
					<div className="mt-3">
						<AutonomyDial
							currentLevel={autonomyLevel}
							onLevelChange={onAutonomyLevelChange}
						/>
					</div>
				</article>

				<article className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<p className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Aprobaciones Críticas
					</p>
					<div className="mt-2 flex items-center gap-3">
						<p
							className={cn(
								"text-2xl font-bold tabular-nums",
								hasPendingApproval
									? "text-amber-500"
									: "text-[var(--text-secondary)]",
							)}
						>
							{hasPendingApproval ? "1" : "0"}
						</p>
						<p className="text-label text-[var(--text-secondary)] leading-tight">
							{hasPendingApproval
								? "Existe una acción crítica esperando revisión de impacto."
								: "No hay acciones que requieran firma."}
						</p>
					</div>
				</article>

				<article className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<p className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Origen de la propuesta
					</p>
					<div className="mt-3 grid gap-2">
						<div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
							<p className="text-3xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
								Regla / Política
							</p>
							<p className="mt-1 text-[12px] font-medium text-[var(--text-primary)]">
								{scenario?.sourceName ?? "Flujo asistido manual"}
							</p>
						</div>
						<div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
							<p className="text-3xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
								Acción
							</p>
							<p className="mt-1 text-[12px] text-[var(--text-primary)]">
								{scenario?.command ?? "Sin transformación activa"}
							</p>
						</div>
					</div>
				</article>
			</div>
		</section>
	);
}
