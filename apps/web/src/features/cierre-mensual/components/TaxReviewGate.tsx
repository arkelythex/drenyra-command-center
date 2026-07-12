import { CircleCheck, CircleAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxGateItem {
	id: string;
	label: string;
	status: "verified" | "warning" | "blocked";
	detail: string;
}

interface TaxReviewGateProps {
	period: string;
	items: TaxGateItem[];
	verdict: "ready" | "attention" | "blocked";
}

const VERDICT_META = {
	ready: {
		icon: CircleCheck,
		color: "text-[var(--color-success)]",
		label: "Todo verificado",
	},
	attention: {
		icon: CircleAlert,
		color: "text-[var(--color-warning)]",
		label: "Requiere atención",
	},
	blocked: {
		icon: TriangleAlert,
		color: "text-[var(--color-danger)]",
		label: "Bloqueado",
	},
} as const;

export function TaxReviewGate({ items, verdict }: TaxReviewGateProps) {
	const meta = VERDICT_META[verdict];
	const Icon = meta.icon;
	const verified = items.filter((i) => i.status === "verified").length;
	const needsAttention = items.length - verified;

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2.5">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<Icon size={15} className={cn("shrink-0", meta.color)} />
					<span className="text-xs font-medium text-[var(--text-primary)]">
						Antes de declarar
					</span>
				</div>
				<span className="text-2xs text-[var(--text-tertiary)] shrink-0">
					{verified}/{items.length} verificaciones{" "}
					{needsAttention > 0 && (
						<span className="text-[var(--color-warning)]">
							· {needsAttention} requieren atención
						</span>
					)}
				</span>
			</div>
		</div>
	);
}
