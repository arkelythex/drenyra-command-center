import { Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FiscalCaseDetails } from "../../../api/drenyra-command-center.api";

export function CasePreview({
	caseDetails,
	pendingApprovalsCount,
}: {
	caseDetails: FiscalCaseDetails;
	pendingApprovalsCount: number;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
				<ShieldAlert size={14} aria-hidden="true" />
				{caseDetails.case.title}
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div className="rounded-lg bg-[var(--surface-2)] p-2">
					<p className="text-lg font-bold text-[var(--text-primary)]">
						{caseDetails.evidence.length}
					</p>
					<p className="text-2xs text-[var(--text-tertiary)]">Evidencias</p>
				</div>
				<div className="rounded-lg bg-[var(--surface-2)] p-2">
					<p className="text-lg font-bold text-[var(--text-primary)]">
						{caseDetails.agentRuns.length}
					</p>
					<p className="text-2xs text-[var(--text-tertiary)]">Runs</p>
				</div>
			</div>
			{caseDetails.case.riskScore !== undefined && (
				<div className="space-y-1">
					<p className="text-2xs text-[var(--text-tertiary)]">Riesgo</p>
					<div
						className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"
						role="progressbar"
						aria-valuenow={caseDetails.case.riskScore ?? 0}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label={`Riesgo: ${caseDetails.case.riskScore ?? 0} por ciento`}
					>
						<div
							className={cn(
								"h-full rounded-full transition-all",
								caseDetails.case.riskScore > 70
									? "bg-red-500"
									: caseDetails.case.riskScore > 40
										? "bg-amber-500"
										: "bg-[var(--color-success)]",
							)}
							style={{
								width: `${Math.min(caseDetails.case.riskScore ?? 0, 100)}%`,
							}}
						/>
					</div>
				</div>
			)}
			{pendingApprovalsCount > 0 && (
				<div
					className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2"
					role="status"
					aria-live="polite"
				>
					<Clock size={14} className="text-amber-400" aria-hidden="true" />
					<span className="text-2xs text-amber-400">
						{pendingApprovalsCount} aprobación(es) pendiente(s)
					</span>
				</div>
			)}
		</div>
	);
}
