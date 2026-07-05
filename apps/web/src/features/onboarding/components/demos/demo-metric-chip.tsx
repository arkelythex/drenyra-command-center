import { cn } from "@/lib/utils";
import type { OutcomeMetric } from "./demo-showcase.types";

export const DemoMetricChip = ({
	label,
	value,
	highlight = false,
}: OutcomeMetric) => (
	<div
		className={cn(
			"flex flex-col gap-0.5 rounded-xl border p-3",
			highlight
				? "border-foreground/20 bg-foreground/10"
				: "border-border/10 bg-foreground/[0.03]",
		)}
	>
		<span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
			{label}
		</span>
		<span
			className={cn(
				"text-sm font-mono font-black tabular-nums",
				highlight ? "text-foreground" : "text-foreground/60",
			)}
		>
			{value}
		</span>
	</div>
);
