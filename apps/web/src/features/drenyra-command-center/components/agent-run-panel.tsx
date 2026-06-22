import type { AgentRun } from "../api/drenyra-command-center.api";
import { FiscalRiskBadge } from "./fiscal-risk-badge";

export function AgentRunPanel({ runs }: { runs: AgentRun[] }) {
	return (
		<div className="space-y-3">
			<h4 className="text-sm font-bold">Structured agent output</h4>
			{runs.length === 0 && (
				<p className="rounded-xl border border-dashed border-[var(--border-subtle)] p-4 text-xs text-[var(--text-tertiary)]">
					Sin agent runs. Los agentes mock producen salida determinística.
				</p>
			)}
			{runs.map((run) => (
				<article
					key={run.id}
					className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
				>
					<div className="flex items-center justify-between gap-3">
						<p className="font-bold">{run.agentType}</p>
						<span className="rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-2 py-1 text-2xs font-bold text-[var(--color-success)]">
							{run.status}
						</span>
					</div>
					{run.output && (
						<div className="mt-3 space-y-3 text-xs text-[var(--text-secondary)]">
							<p>{run.output.summary}</p>
							<FiscalRiskBadge
								riskLevel={run.output.riskLevel}
								score={Math.round(run.output.confidence * 100)}
							/>
							<ul className="list-disc space-y-1 pl-4">
								{run.output.findings.map((finding) => (
									<li key={finding}>{finding}</li>
								))}
							</ul>
							<p>
								<strong>Acciones:</strong>{" "}
								{run.output.recommendedActions.join(" · ")}
							</p>
							<p>
								<strong>Evidencia requerida:</strong>{" "}
								{run.output.requiredEvidence.join(", ")}
							</p>
						</div>
					)}
				</article>
			))}
		</div>
	);
}
