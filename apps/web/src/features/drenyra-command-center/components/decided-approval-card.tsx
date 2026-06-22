import { cn } from "@/lib/utils";
import type { ApprovalRequest } from "../api/drenyra-command-center.api";

export function DecidedApprovalCard({
	approval,
}: {
	approval: ApprovalRequest;
}) {
	return (
		<article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
			<div className="flex items-start justify-between gap-2">
				<div>
					<p className="text-xs font-bold">{approval.title}</p>
					<p className="mt-1 text-2xs font-semibold text-[var(--text-secondary)]">
						{approval.status} ·{" "}
						{approval.decidedAt
							? new Date(approval.decidedAt).toLocaleString()
							: "sin fecha"}
					</p>
				</div>
				<span
					className={cn(
						"rounded-full border px-2 py-1 text-2xs font-bold",
						approval.status === "APPROVED"
							? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
							: "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
					)}
				>
					{approval.status}
				</span>
			</div>
			{approval.decisionReason && (
				<p className="mt-2 text-xs text-[var(--text-secondary)]">
					{approval.decisionReason}
				</p>
			)}
			<p className="mt-2 text-2xs text-[var(--text-tertiary)]">
				{approval.diff.summary}
			</p>
		</article>
	);
}
