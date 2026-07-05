import { Bot } from "lucide-react";
import type { AgentAnalysisProps } from "../FiscalInspector.types";
import { FiscalInspectorSection } from "./FiscalInspectorSection";

/**
 * Displays the AI agent's analysis for a proposed fiscal action.
 */
export function FiscalInspectorAgentAnalysis({ analysis }: AgentAnalysisProps) {
	return (
		<FiscalInspectorSection title="Análisis del Agente">
			<div className="rounded-xl border border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]/50 p-3 space-y-2">
				<div className="flex items-center gap-2">
					<Bot size={14} className="text-[var(--color-info)]" />
					<span className="text-2xs font-bold text-[var(--color-text-primary)]">
						{analysis.agentName}
					</span>
					<span className="text-3xs font-bold text-[var(--color-text-muted)] ml-auto">
						{Math.round(analysis.confidence * 100)}% confianza
					</span>
				</div>
				<p className="text-2xs text-[var(--color-text-secondary)] leading-relaxed">
					{analysis.proposal}
				</p>
				<p className="text-3xs text-[var(--color-text-muted)] italic">
					{analysis.rationale}
				</p>
				{analysis.risks.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{analysis.risks.map((risk) => (
							<span
								key={risk}
								className="rounded-full border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/6 px-2 py-0.5 text-3xs font-bold text-[var(--color-warning)]"
							>
								{risk}
							</span>
						))}
					</div>
				)}
			</div>
		</FiscalInspectorSection>
	);
}
