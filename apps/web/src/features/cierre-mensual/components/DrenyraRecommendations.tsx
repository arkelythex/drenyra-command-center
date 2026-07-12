import { useState } from "react";
import {
	ArrowUpCircle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	FileText,
	Loader2,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DrenyraRecommendation {
	id: string;
	title: string;
	savings: string;
	confidence: number;
	confidenceLabel: string;
	sources: string[];
	autoApplyCount: number;
	totalCount: number;
}

const MOCK_RECOMMENDATIONS: DrenyraRecommendation[] = [
	{
		id: "rec-1",
		title: "Clasificar 142 compras antes de impuestos",
		savings: "Ahorra aprox. 38 min",
		confidence: 0.88,
		confidenceLabel: "Alta",
		sources: [
			"XML importados",
			"Historial de julio",
			"Plan contable",
			"Reglas IGV",
		],
		autoApplyCount: 124,
		totalCount: 142,
	},
	{
		id: "rec-2",
		title: "Conciliar 8 movimientos bancarios sin match",
		savings: "Ahorra aprox. 15 min",
		confidence: 0.72,
		confidenceLabel: "Media",
		sources: ["Extracto BCP", "Ledger contable"],
		autoApplyCount: 0,
		totalCount: 8,
	},
];

export function DrenyraRecommendations() {
	const [expanded, setExpanded] = useState<string | null>(null);
	const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

	const handleReview = (id: string) => {
		setExpanded(expanded === id ? null : id);
	};

	const handleApply = (id: string) => {
		setRunningIds((prev) => new Set(prev).add(id));
		setTimeout(() => {
			setRunningIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}, 2000);
	};

	return (
		<section className="space-y-3">
			<h2 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
				Recomendado por Drenyra
			</h2>

			<div className="space-y-3">
				{MOCK_RECOMMENDATIONS.map((rec) => {
					const isRunning = runningIds.has(rec.id);
					const isExpanded = expanded === rec.id;

					return (
						<div
							key={rec.id}
							className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)]/50 overflow-hidden transition-all"
						>
							{/* Main row */}
							<div className="flex items-center justify-between gap-3 px-4 py-2.5">
								<div className="min-w-0 flex-1 flex items-center gap-2">
									<p className="text-xs font-medium text-[var(--text-primary)] truncate">
										{rec.title}
									</p>
									<span className="rounded-full bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-success)] shrink-0">
										{rec.confidenceLabel}
									</span>
									<span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
										{rec.savings}
									</span>
								</div>

								<div className="flex shrink-0 items-center gap-1.5">
									<Button
										size="sm"
										variant="outline"
										className="h-7 text-[10px] font-medium px-2"
										onClick={() => handleReview(rec.id)}
									>
										<FileText size={11} className="mr-1" />
										Revisar
										{isExpanded ? (
											<ChevronUp size={11} className="ml-0.5" />
										) : (
											<ChevronDown size={11} className="ml-0.5" />
										)}
									</Button>
									{rec.autoApplyCount > 0 && (
										<Button
											size="sm"
											className="h-7 text-[10px] font-medium px-2"
											disabled={isRunning}
											onClick={() => handleApply(rec.id)}
										>
											{isRunning ? (
												<Loader2 size={11} className="mr-1 animate-spin" />
											) : (
												<CheckCircle size={11} className="mr-1" />
											)}
											{isRunning
												? "Aplicando..."
												: `Aplicar ${rec.autoApplyCount}`}
										</Button>
									)}
								</div>
							</div>

							{/* Expanded detail: sources + actions */}
							{isExpanded && (
								<div className="border-t border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 space-y-3">
									<div>
										<p className="text-2xs font-bold uppercase tracking-wider text-[var(--text-quaternary)] mb-1.5">
											Basado en
										</p>
										<div className="flex flex-wrap gap-1.5">
											{rec.sources.map((source) => (
												<span
													key={source}
													className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-0.5 text-2xs font-mono text-[var(--text-secondary)]"
												>
													{source}
												</span>
											))}
										</div>
									</div>

									<div className="flex items-center gap-2">
										<span className="text-2xs text-[var(--text-tertiary)]">
											{rec.autoApplyCount} de {rec.totalCount} pueden aplicarse
											automáticamente
										</span>
										<div className="flex-1">
											<div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
												<div
													className="h-full rounded-full bg-[var(--color-success)]"
													style={{
														width: `${(rec.autoApplyCount / rec.totalCount) * 100}%`,
													}}
												/>
											</div>
										</div>
									</div>

									{rec.autoApplyCount < rec.totalCount && (
										<div className="flex items-center gap-2 pt-1">
											<Button
												size="sm"
												variant="outline"
												className="h-8 text-2xs font-semibold"
											>
												<CheckCircle size={12} className="mr-1.5" />
												Aprobar restantes ({rec.totalCount - rec.autoApplyCount}
												)
											</Button>
											<Button
												size="sm"
												variant="destructive"
												className="h-8 text-2xs font-semibold"
											>
												<XCircle size={12} className="mr-1.5" />
												Rechazar
											</Button>
											<Button
												size="sm"
												variant="ghost"
												className="h-8 text-2xs font-semibold"
											>
												<ArrowUpCircle size={12} className="mr-1.5" />
												Escalar
											</Button>
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
}
