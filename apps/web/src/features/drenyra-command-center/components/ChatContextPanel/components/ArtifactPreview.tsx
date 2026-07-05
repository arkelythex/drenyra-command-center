import { BarChart3, FileText, PieChart, Table } from "lucide-react";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";

export function ArtifactPreview({ artifact }: { artifact: HubArtifact }) {
	switch (artifact.type) {
		case "sheet_diff": {
			const { summary } = artifact.payload;
			return (
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs font-bold text-[var(--color-info)]">
						<Table size={14} aria-hidden="true" />
						Diff de conciliación
					</div>
					<div className="grid grid-cols-3 gap-1 text-center">
						<div className="rounded-lg bg-[var(--surface-2)] p-2">
							<p className="text-lg font-bold text-[var(--text-primary)]">
								{summary.total}
							</p>
							<p className="text-2xs text-[var(--text-tertiary)]">Filas</p>
						</div>
						<div className="rounded-lg bg-[var(--color-success)]/10 p-2">
							<p className="text-lg font-bold text-[var(--color-success)]">
								{summary.updated}
							</p>
							<p className="text-2xs text-[var(--color-success)]/70">
								Actualizadas
							</p>
						</div>
						<div className="rounded-lg bg-amber-500/10 p-2">
							<p className="text-lg font-bold text-amber-400">
								{summary.flagged}
							</p>
							<p className="text-2xs text-amber-400/70">Flagged</p>
						</div>
					</div>
				</div>
			);
		}
		case "accounting_diff": {
			const { diffs, scope } = artifact.payload;
			return (
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs font-bold text-[var(--color-warning)]">
						<FileText size={14} aria-hidden="true" />
						Diff contable: {scope}
					</div>
					<p className="text-2xs text-[var(--text-tertiary)]">
						{diffs.length} cambios detectados
					</p>
					<div className="max-h-32 space-y-1 overflow-y-auto">
						{diffs.slice(0, 5).map((d, i) => (
							<div
								key={i}
								className="rounded bg-[var(--surface-2)] px-2 py-1 text-2xs"
							>
								<span className="font-medium text-[var(--text-primary)]">
									{d.field}
								</span>
								<span className="text-[var(--text-tertiary)]">
									: {d.before} → {d.after}
								</span>
							</div>
						))}
					</div>
				</div>
			);
		}
		case "chart": {
			const { data, labels } = artifact.payload;
			return (
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs font-bold text-[var(--color-info)]">
						<BarChart3 size={14} aria-hidden="true" />
						{artifact.title || "Gráfico"}
					</div>
					<div
						className="flex items-end gap-1"
						style={{ height: 48 }}
						role="img"
						aria-label={
							artifact.title ? `Gráfico: ${artifact.title}` : "Gráfico de datos"
						}
					>
						{data.slice(0, 8).map((val: number, i: number) => {
							const max = Math.max(...data, 1);
							const h = (val / max) * 100;
							return (
								<div
									key={i}
									className="w-full rounded-t bg-[var(--color-info)]/40"
									style={{ height: `${h}%`, minHeight: 4 }}
									title={labels?.[i] ?? String(val)}
								/>
							);
						})}
					</div>
				</div>
			);
		}
		case "dashboard": {
			const { primaryMetric, statusScore } = artifact.payload;
			return (
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs font-bold text-[var(--color-info)]">
						<PieChart size={14} aria-hidden="true" />
						Dashboard
					</div>
					<div className="rounded-lg bg-[var(--surface-2)] p-2 text-center">
						<p className="text-xl font-bold text-[var(--text-primary)]">
							{primaryMetric.value}
						</p>
						<p className="text-2xs text-[var(--text-tertiary)]">
							{primaryMetric.trend}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
							<div
								className="h-full rounded-full bg-[var(--color-info)] transition-all"
								style={{ width: `${Math.min(statusScore, 100)}%` }}
							/>
						</div>
						<span className="text-2xs text-[var(--text-tertiary)]">
							{statusScore}%
						</span>
					</div>
				</div>
			);
		}
		default:
			return (
				<div className="text-xs text-[var(--text-tertiary)]">
					Artifact: {artifact.type}
				</div>
			);
	}
}
