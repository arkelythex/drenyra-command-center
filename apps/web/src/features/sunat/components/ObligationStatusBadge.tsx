/**
 * ObligationStatusBadge — color-coded badge for tax obligation status.
 */

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaxObligation } from "./SunatDashboard.types";

interface ObligationStatusBadgeProps {
	status: TaxObligation["status"];
}

const CONFIG: Record<
	string,
	{ label: string; className: string; icon: LucideIcon }
> = {
	"al-dia": {
		label: "Al día",
		className:
			"text-[var(--premium-success)] bg-[var(--premium-success)]/10 border-[var(--premium-success)]/20",
		icon: CheckCircle2,
	},
	"por-vencer": {
		label: "Por vencer",
		className:
			"text-[var(--premium-warning)] bg-[var(--premium-warning)]/10 border-[var(--premium-warning)]/20",
		icon: AlertTriangle,
	},
	vencido: {
		label: "Vencido",
		className:
			"text-[var(--premium-danger)] bg-[var(--premium-danger)]/10 border-[var(--premium-danger)]/20",
		icon: XCircle,
	},
};

export function ObligationStatusBadge({ status }: ObligationStatusBadgeProps) {
	const c = CONFIG[status];
	const Icon = c.icon;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider",
				c.className,
			)}
		>
			<Icon size={10} aria-hidden="true" />
			{c.label}
		</span>
	);
}
