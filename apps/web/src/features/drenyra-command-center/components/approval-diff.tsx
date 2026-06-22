import { GitCompareArrows } from "lucide-react";
import type { ApprovalRequest } from "../api/drenyra-command-center.api";

export function ApprovalDiff({ approval }: { approval: ApprovalRequest }) {
	return (
		<article className="rounded-xl border border-[var(--color-warning)]/25 bg-[var(--color-warning)]/8 p-3">
			<div className="flex items-start justify-between gap-2">
				<div>
					<p className="text-xs font-bold">{approval.title}</p>
					<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
						{approval.status} · {approval.autonomyLevel}
					</p>
				</div>
				<GitCompareArrows size={14} className="text-[var(--color-warning)]" />
			</div>
			<p className="mt-2 text-xs text-[var(--text-secondary)]">
				{approval.diff.summary}
			</p>
		</article>
	);
}
