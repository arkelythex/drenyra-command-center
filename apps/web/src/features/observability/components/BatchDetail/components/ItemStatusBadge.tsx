import { cn } from "@/lib/utils";
import type { BatchItemStatus } from "../../../types";
import { ITEM_STATUS_BADGE } from "../BatchDetail.data";

export function ItemStatusBadge({ status }: { status: BatchItemStatus }) {
	const style = ITEM_STATUS_BADGE[status] ?? ITEM_STATUS_BADGE.pending;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
				style.color,
			)}
		>
			{style.label}
		</span>
	);
}
