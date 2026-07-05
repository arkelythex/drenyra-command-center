import { cn } from "@/lib/utils";
import type { RecentEvent } from "./cost-dashboard.types";

interface EventRowProps {
	event: RecentEvent;
}

export const EventRow = ({ event }: EventRowProps) => (
	<div className="flex items-center gap-3 border-b border-border/5 py-2 last:border-0">
		<div
			className={cn(
				"h-1.5 w-1.5 flex-shrink-0 rounded-full",
				event.wasBlocked ? "bg-red-500" : "bg-[var(--premium-success)]",
			)}
		/>

		<div className="min-w-0 flex-1">
			<span className="text-3xs font-black uppercase tracking-wider text-foreground/60">
				{event.agentType}
			</span>
			<p className="truncate font-mono text-[8px] text-muted-foreground/40">
				{event.modelUsed.split("/").pop()}
			</p>
		</div>

		<div className="flex-shrink-0 text-right">
			<span className="text-2xs font-mono font-black text-foreground/70 tabular-nums">
				${event.costUsd.toFixed(5)}
			</span>
			<p className="font-mono text-[7px] text-muted-foreground/30">
				{event.totalTokens.toLocaleString()}t
			</p>
		</div>
	</div>
);
