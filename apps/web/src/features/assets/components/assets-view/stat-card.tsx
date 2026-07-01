import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
	icon: ReactElement;
	label: string;
	value: string;
	trend: string;
	trendColor: string;
	isAlert?: boolean;
}

export function StatCard({
	icon,
	label,
	value,
	trend,
	trendColor,
	isAlert = false,
}: StatCardProps) {
	return (
		<div
			className={cn(
				"group relative overflow-hidden rounded-2xl border bg-card p-5 transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 hover:shadow-lg",
				isAlert ? "border-red-500/30 bg-red-500/5" : "border-border/50",
			)}
		>
			<div className="flex justify-between items-start mb-2">
				<div
					className={cn(
						"p-2 rounded-lg text-foreground/80 bg-background/50 border border-border/50  group-hover:scale-110 transition-transform",
						isAlert &&
							"text-destructive bg-destructive/10 border-destructive/20",
					)}
				>
					{icon}
				</div>
				{isAlert ? (
					<span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
				) : null}
			</div>
			<p className="text-label font-black text-muted-foreground uppercase tracking-widest">
				{label}
			</p>
			<p className="text-2xl font-black text-foreground mt-1 tracking-tight">
				{value}
			</p>
			<p
				className={cn(
					"text-2xs font-bold uppercase mt-2 opacity-80",
					trendColor,
				)}
			>
				{trend}
			</p>
		</div>
	);
}
