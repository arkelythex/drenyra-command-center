import { ShieldCheck, X } from "lucide-react";
import type { DetailHeaderProps } from "../FiscalInspector.types";
import { FiscalInspectorRiskBadge } from "./FiscalInspectorRiskBadge";
import { FiscalInspectorPipeline } from "./FiscalInspectorPipeline";
import { FiscalInspectorAgentAnalysis } from "./FiscalInspectorAgentAnalysis";
import { FiscalInspectorEvidence } from "./FiscalInspectorEvidence";
import { FiscalInspectorApproval } from "./FiscalInspectorApproval";
import { FiscalInspectorSection } from "./FiscalInspectorSection";

/**
 * Detail view for a single fiscal action.
 * Shows risk level, status pipeline, agent analysis, evidence, and approval status.
 */
export function FiscalInspectorDetail({ action, onClose }: DetailHeaderProps) {
	return (
		<>
			{/* Header */}
			<div className="shrink-0 border-b border-[var(--color-stroke-1)] px-5 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ShieldCheck size={16} className="text-[var(--color-info)]" />
						<span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
							Inspector Fiscal
						</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
						aria-label="Cerrar inspector fiscal"
					>
						<X size={16} />
					</button>
				</div>
				<p className="mt-2 text-sm font-bold text-[var(--color-text-primary)] leading-snug">
					{action.summary}
				</p>
				<p className="mt-0.5 text-2xs text-[var(--color-text-muted)]">
					{action.companyRuc} · {action.module} · {action.traceId.slice(0, 8)}
				</p>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 p-5">
				<FiscalInspectorRiskBadge
					riskLevel={action.riskLevel}
					impact={action.impact}
				/>

				<FiscalInspectorSection title="Pipeline Fiscal">
					<FiscalInspectorPipeline status={action.status} />
				</FiscalInspectorSection>

				{action.agentAnalysis && (
					<FiscalInspectorAgentAnalysis analysis={action.agentAnalysis} />
				)}

				<FiscalInspectorEvidence evidence={action.evidence} />

				{action.requiresApproval && action.requiredApprovers && (
					<FiscalInspectorApproval
						requiredApprovers={action.requiredApprovers}
						approvedBy={action.approvedBy}
					/>
				)}
			</div>

			{/* Footer */}
			<div className="shrink-0 border-t border-[var(--color-stroke-1)] px-5 py-3">
				<p className="text-3xs text-[var(--color-text-disabled)] text-center">
					Toda decisión fiscal queda registrada y es auditable.
				</p>
			</div>
		</>
	);
}
