import { Scale } from "lucide-react";
import { cn, n } from "@/lib/utils";
import type { DiscrepancyScenario } from "../../anomaly/discrepancy-scenario";
import type { DiscrepancyCommitStatus } from "../../anomaly/use-discrepancy-resolution.store";
import {
	getCommitLabel,
	getCommitTone,
	getScenarioImpact,
} from "./hub-empty-state.helpers";

interface DecisionGateCardProps {
	scenario: DiscrepancyScenario | null;
	commitStatus: DiscrepancyCommitStatus;
	undoSecondsLeft: number;
	isOpen: boolean;
	onReviewDiscrepancy: () => void;
}

export function DecisionGateCard({
	scenario,
	commitStatus,
	undoSecondsLeft,
	isOpen,
	onReviewDiscrepancy,
}: DecisionGateCardProps) {
	const impact = getScenarioImpact(scenario);

	return (
		<section className="hub-panel h-full">
			<div className="mb-4">
				<p className="text-sm font-semibold text-[var(--text-primary)]">Revisión necesaria</p>
				<p className="mt-1 text-xs text-[var(--text-secondary)]">
					Confirma el impacto antes de ejecutar cualquier ajuste automático.
				</p>
			</div>

			<div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
				<article className="hub-panel-inset">
					<p className="text-label font-medium text-[var(--text-secondary)]">Propuesta actual</p>
					<p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
						{scenario?.command ?? "Sin propuesta activa"}
					</p>
					<p className="mt-1 text-xs text-[var(--text-secondary)]">
						Fuente: {scenario?.sourceName ?? "Conector SIRE/SUNAT"}
					</p>
				</article>

				<article className="hub-panel-inset">
					<p className="text-label font-medium text-[var(--text-secondary)]">Impacto estimado</p>
					<p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
						Delta estimado {n(impact.estimatedDelta)}
					</p>
					<p className="mt-1 text-xs text-[var(--text-secondary)]">
						{impact.flaggedRows} conflictos + {impact.updatedRows} ajustes auditables
					</p>
				</article>

				<article className="hub-panel-inset border-primary-subtle bg-primary/5 p-4">
					<p className="text-label font-medium text-[var(--text-secondary)]">Estado actual</p>
					<p className={cn("mt-1 text-sm font-semibold", getCommitTone(commitStatus))}>
						{getCommitLabel(commitStatus, undoSecondsLeft)}
					</p>
					<button
						onClick={onReviewDiscrepancy}
						className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-label font-medium text-primary transition-colors hover:bg-primary/15"
					>
						<Scale size={12} />
						{isOpen ? "Cerrar revisión" : "Revisar propuesta"}
					</button>
				</article>
			</div>
		</section>
	);
}
