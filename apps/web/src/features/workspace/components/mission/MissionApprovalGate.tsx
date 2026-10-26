import type { MissionProposal } from "@drenyra/mission-domain";
import { useState } from "react";
import { MissionEvidenceBundle } from "./MissionEvidenceBundle";

interface MissionApprovalGateProps {
	proposal: MissionProposal;
	onApprove: () => void;
	onReject: (reason: string) => void;
	isSubmitting: boolean;
}

const RISK_LABELS: Record<string, string> = {
	LOW: "Bajo",
	MEDIUM: "Medio",
	HIGH: "Alto",
};

/**
 * The human decision on the agent's proposal. Approving is the primary action;
 * rejecting needs a written reason, which the receipt records.
 */
export function MissionApprovalGate({
	proposal,
	onApprove,
	onReject,
	isSubmitting,
}: MissionApprovalGateProps) {
	const [rejectReason, setRejectReason] = useState("");
	const reason = rejectReason.trim();
	const reasonId = `reject-reason-${proposal.id}`;

	return (
		<section
			aria-labelledby={`gate-title-${proposal.id}`}
			className="w-full max-w-2xl space-y-5 rounded-xl border border-border bg-card p-5 text-card-foreground"
		>
			<div className="space-y-1">
				<div className="flex items-baseline gap-2">
					<h3
						id={`gate-title-${proposal.id}`}
						className="text-base font-medium tracking-tight"
					>
						Aprobación requerida
					</h3>
					<span className="font-mono text-xs text-muted-foreground">
						v{proposal.version}
					</span>
				</div>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{proposal.summary}
				</p>
				<p className="text-sm text-foreground">
					Riesgo: {RISK_LABELS[proposal.riskLevel] ?? proposal.riskLevel}
				</p>
			</div>

			<MissionEvidenceBundle
				evidence={proposal.evidence}
				version={proposal.version}
				evidenceHash={proposal.evidenceHash}
			/>

			<div className="space-y-2">
				<label htmlFor={reasonId} className="text-sm font-medium">
					Motivo de rechazo
				</label>
				<textarea
					id={reasonId}
					value={rejectReason}
					onChange={(event) => setRejectReason(event.target.value)}
					placeholder="Obligatorio solo si rechazas"
					rows={2}
					className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
				/>
			</div>

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					disabled={isSubmitting || reason === ""}
					title={reason === "" ? "Escribe el motivo para rechazar" : undefined}
					onClick={() => onReject(reason)}
					className="flex h-11 items-center justify-center rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
				>
					Rechazar
				</button>
				<button
					type="button"
					disabled={isSubmitting}
					onClick={onApprove}
					className="flex h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
				>
					Aprobar
				</button>
			</div>
		</section>
	);
}
