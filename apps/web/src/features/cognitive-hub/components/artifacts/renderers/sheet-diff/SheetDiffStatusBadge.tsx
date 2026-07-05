import type { SheetDiffRow } from "@drenyra/shared/artifacts";
import { cn } from "@/lib/utils";

interface SheetDiffStatusBadgeProps {
	status: SheetDiffRow["status"];
}

const STATUS_LABELS: Record<SheetDiffRow["status"], string> = {
	updated: "Corregido",
	unchanged: "Sin cambios",
	flagged: "Revisión",
};

export function SheetDiffStatusBadge({ status }: SheetDiffStatusBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
				status === "updated" &&
					"border-[rgba(var(--premium-success-rgb),0.30)] bg-[rgba(var(--premium-success-rgb),0.10)] text-[var(--premium-success)]",
				status === "flagged" &&
					"border-amber-500/30 bg-amber-500/10 text-amber-500",
				status === "unchanged" &&
					"border-border/50 bg-background/60 text-muted-foreground",
			)}
		>
			{STATUS_LABELS[status]}
		</span>
	);
}
