import { formatPEN, formatPercent } from "@/lib/utils";
import type { ExpenseTooltipPayload } from "./expenses-tab.types";

interface ExpensesChartTooltipProps {
	active?: boolean;
	payload?: ExpenseTooltipPayload[];
}

export function ExpensesChartTooltip({
	active,
	payload,
}: ExpensesChartTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const record = payload[0]?.payload;
	if (!record) return null;

	return (
		<div className="min-w-[220px] rounded-xl border border-border/40 bg-white/95 px-3 py-2.5 shadow-xl ">
			<p className="text-sm font-semibold text-foreground">{record.category}</p>
			<div className="mt-2 space-y-1.5 text-xs">
				<div className="flex items-center justify-between gap-3">
					<span className="text-muted-foreground">Monto</span>
					<span className="font-semibold text-foreground">
						{formatPEN(record.total)}
					</span>
				</div>
				<div className="flex items-center justify-between gap-3">
					<span className="text-muted-foreground">Participación</span>
					<span className="font-semibold text-foreground">
						{formatPercent(record.percentage)}
					</span>
				</div>
				<div className="flex items-center justify-between gap-3">
					<span className="text-muted-foreground">Comprobantes</span>
					<span className="font-semibold text-foreground">{record.count}</span>
				</div>
			</div>
		</div>
	);
}
