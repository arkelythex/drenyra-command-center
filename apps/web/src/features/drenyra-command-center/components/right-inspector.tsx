import { useMemo } from "react";
import type { FiscalCaseDetails } from "../api/drenyra-command-center.api";
import { ApprovalDecisionControl } from "./approval-decision-control";
import { AuditTrail } from "./audit-trail";
import { CommandCapabilityAuditPanel } from "./command-capability-audit-panel";
import { DecidedApprovalCard } from "./decided-approval-card";
import { EvidenceCard } from "./evidence-card";

export function RightInspector({
	details,
	onApprove,
	onReject,
	isBusy,
	errorMessage,
}: {
	details?: FiscalCaseDetails;
	onApprove: (id: string, decisionReason: string) => void;
	onReject: (id: string, decisionReason: string) => void;
	isBusy: boolean;
	errorMessage?: string;
}) {
	const pendingApprovals = useMemo(
		() =>
			details?.approvals.filter((approval) => approval.status === "PENDING") ??
			[],
		[details],
	);
	const decidedApprovals = useMemo(
		() =>
			details?.approvals.filter((approval) => approval.status !== "PENDING") ??
			[],
		[details],
	);
	return (
		<aside className="border-l border-[var(--border-subtle)] bg-[var(--surface-2)]/80 p-4">
			<h3 className="text-sm font-bold">Right Inspector</h3>
			<p className="mt-1 text-xs text-[var(--text-tertiary)]">
				Evidencia, riesgo, auditoría y controles humanos.
			</p>
			{!details ? (
				<p className="mt-6 text-xs text-[var(--text-tertiary)]">
					Seleccioná un caso.
				</p>
			) : (
				<div className="mt-5 space-y-5">
					<section>
						<h4 className="mb-2 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
							Evidencia
						</h4>
						<div className="space-y-2">
							{details.evidence.slice(0, 4).map((item) => (
								<EvidenceCard key={item.id} evidence={item} />
							))}
						</div>
					</section>
					<section>
						<h4 className="mb-2 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
							Aprobaciones pendientes
						</h4>
						<div className="space-y-3">
							{pendingApprovals.length === 0 && (
								<p className="text-xs text-[var(--text-tertiary)]">
									No hay aprobaciones pendientes.
								</p>
							)}
							{pendingApprovals.map((approval) => (
								<ApprovalDecisionControl
									key={approval.id}
									approval={approval}
									onApprove={onApprove}
									onReject={onReject}
									isBusy={isBusy}
									serverErrorMessage={errorMessage}
								/>
							))}
						</div>
					</section>
					<section>
						<h4 className="mb-2 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
							Historial de aprobaciones
						</h4>
						<div className="space-y-2">
							{decidedApprovals.length === 0 && (
								<p className="text-xs text-[var(--text-tertiary)]">
									No hay aprobaciones decididas.
								</p>
							)}
							{decidedApprovals.slice(0, 4).map((approval) => (
								<DecidedApprovalCard key={approval.id} approval={approval} />
							))}
						</div>
					</section>
					<section>
						<h4 className="mb-2 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
							Audit trail
						</h4>
						<AuditTrail events={details.auditEvents.slice(0, 6)} />
					</section>
					<CommandCapabilityAuditPanel />
				</div>
			)}
		</aside>
	);
}
