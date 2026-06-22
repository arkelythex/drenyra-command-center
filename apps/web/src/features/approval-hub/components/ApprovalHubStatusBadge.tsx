import { STATUS_BADGE } from "../ApprovalHubPage.data";
import type { ApprovalItem } from "../ApprovalHubPage.types";

interface ApprovalHubStatusBadgeProps {
	status: ApprovalItem["status"];
}

export function ApprovalHubStatusBadge({ status }: ApprovalHubStatusBadgeProps) {
	const badge = STATUS_BADGE[status];
	const Icon = badge.icon;

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-3xs font-bold ${badge.bg}`}
		>
			<Icon size={10} />
			{badge.label}
		</span>
	);
}
