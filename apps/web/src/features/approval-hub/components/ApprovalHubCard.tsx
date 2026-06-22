import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FISCAL_RISK_COLORS } from "@arkelythex/domain";
import { Button } from "@/components/ui/button";
import { MODULE_LABELS } from "../ApprovalHubPage.data";
import { ApprovalHubStatusBadge } from "./ApprovalHubStatusBadge";
import type { ApprovalItem } from "../ApprovalHubPage.types";

interface ApprovalHubCardProps {
	approval: ApprovalItem;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
}

export function ApprovalHubCard({ approval, onApprove, onReject }: ApprovalHubCardProps) {
	const urgencyBg = approval.urgency === "URGENT"
		? "border-l-[var(--color-danger)]"
		: "";

	return (
		<div
			className={cn(
				"rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition-all hover:bg-[var(--surface-2)]",
				approval.urgency !== "LOW" && "border-l-[3px]",
				urgencyBg,
			)}
		>
			<div className="flex items-start gap-3">
				<div className="flex-1 min-w-0">
					{/* Module + Risk + Urgency badges row */}
					<div className="mb-1 flex items-center gap-2 flex-wrap">
						<span className="text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)]">
							{MODULE_LABELS[approval.module] ?? approval.module}
						</span>
						<span
							className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-3xs font-bold"
							style={{
								borderColor: FISCAL_RISK_COLORS[approval.riskLevel],
								color: FISCAL_RISK_COLORS[approval.riskLevel],
							}}
						>
							{approval.riskLevel === "CRITICAL"
								? <AlertTriangle size={10} />
								: <ShieldAlert size={10} />}
							{approval.riskLevel}
						</span>
						{approval.urgency !== "LOW" && (
							<span className="text-3xs font-bold text-[var(--color-danger)]">
								{approval.urgency}
							</span>
						)}
					</div>

					{/* Summary */}
					<p className="text-xs font-bold text-[var(--text-primary)]">
						{approval.summary}
					</p>
					<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
						{approval.companyName} · RUC {approval.companyRuc} ·{" "}
						{approval.proposedBy}
					</p>

					{/* Rejection reason */}
					{approval.status === "REJECTED" && approval.rejectionReason && (
						<p className="mt-1 text-2xs text-[var(--color-danger)] italic">
							Motivo: {approval.rejectionReason}
						</p>
					)}

					{/* Action buttons for pending */}
					{approval.status === "PENDING" && (
						<div className="mt-3 flex items-center gap-2">
							<Button
								size="sm"
								className="h-7 px-3 text-2xs font-bold"
								onClick={() => onApprove(approval.id)}
							>
								<CheckCircle2 size={12} className="mr-1" />
								Aprobar
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-3 text-2xs font-bold text-[var(--color-danger)]"
								onClick={() => onReject(approval.id)}
							>
								<XCircle size={12} className="mr-1" />
								Rechazar
							</Button>
						</div>
					)}
				</div>

				{/* Status + date column */}
				<div className="shrink-0 text-right">
					<ApprovalHubStatusBadge status={approval.status} />
					<p className="mt-1 text-3xs text-[var(--text-tertiary)]">
						{new Date(approval.createdAt).toLocaleDateString("es-PE")}
					</p>
				</div>
			</div>
		</div>
	);
}
