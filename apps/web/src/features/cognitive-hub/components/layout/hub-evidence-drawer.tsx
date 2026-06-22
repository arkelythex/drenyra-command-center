import { useMemo } from "react";
import { ChevronDown, ChevronUp, Fingerprint, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CognitiveActivityEntry } from "../../hooks/cognitive-stream";

interface HubEvidenceDrawerProps {
	entries: CognitiveActivityEntry[];
	activeRunId: string | null;
	isExpanded: boolean;
	onToggle: () => void;
}

const STATUS_STYLES: Record<CognitiveActivityEntry["status"], string> = {
	success: "bg-success-soft text-success border-success-subtle",
	warning: "bg-warning-soft text-warning border-warning-subtle",
	error: "bg-danger-soft text-danger border-danger-subtle",
	pending: "bg-info-soft text-info border-info-subtle",
	info: "bg-surface-3 text-secondary border-[var(--color-stroke-1)]",
};

export const HubEvidenceDrawer = ({
	entries,
	activeRunId,
	isExpanded,
	onToggle,
}: HubEvidenceDrawerProps) => {
	const visibleEntries = useMemo(
		() =>
			entries
				.filter((entry) => !activeRunId || entry.runId === activeRunId)
				.slice(-3)
				.reverse(),
		[entries, activeRunId],
	);

	return (
		<section className="mb-3 rounded-[var(--radius-lg)] border border-[var(--color-stroke-2)] bg-[var(--color-surface-2)] p-3">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between gap-3 text-left"
			>
				<div className="flex items-center gap-2">
					<span className="chip chip-info">L3 Evidencia</span>
					<span className="text-label font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
						Traceabilidad Activa
					</span>
				</div>
				<span className="inline-flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
					{isExpanded ? (
						<>
							Ocultar detalle <ChevronUp size={12} />
						</>
					) : (
						<>
							Ver detalle <ChevronDown size={12} />
						</>
					)}
				</span>
			</button>

			{isExpanded ? (
				<div className="mt-3 space-y-2">
					{visibleEntries.length === 0 ? (
						<div className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--color-surface-3)] px-3 py-2 text-label text-[var(--color-text-muted)]">
							Sin evidencia del run activo. Ejecuta una propuesta para iniciar
							trazabilidad.
						</div>
					) : (
						visibleEntries.map((entry) => (
							<article
								key={entry.id}
								className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--color-surface-3)] px-3 py-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
							>
								<div>
									<p className="text-2xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
										Fuente
									</p>
									<p className="text-[12px] font-semibold text-[var(--color-text-primary)]">
										{entry.label}
									</p>
								</div>
								<div>
									<p className="text-2xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
										Timestamp
									</p>
									<p className="font-mono text-label text-[var(--color-text-secondary)]">
										{new Date(entry.timestamp).toLocaleTimeString("es-PE", {
											hour: "2-digit",
											minute: "2-digit",
											second: "2-digit",
										})}
									</p>
								</div>
								<div>
									<p className="text-2xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
										Transformación
									</p>
									<p className="truncate text-label text-[var(--color-text-secondary)]">
										{entry.detail ?? "Sin detalle"}
									</p>
								</div>
								<div className="flex items-center justify-end">
									<span
										className={cn(
											"inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-1 text-2xs font-semibold uppercase tracking-[0.1em]",
											STATUS_STYLES[entry.status],
										)}
									>
										<Sigma size={10} />
										{entry.status}
									</span>
								</div>
							</article>
						))
					)}

					<div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--color-surface-3)] px-3 py-2 text-2xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
						<span className="inline-flex items-center gap-2">
							<Fingerprint size={12} />
							Hash del contexto
						</span>
						<span className="font-mono">
							{activeRunId ? activeRunId.slice(0, 12) : "N/A"}
						</span>
					</div>
				</div>
			) : null}
		</section>
	);
};
