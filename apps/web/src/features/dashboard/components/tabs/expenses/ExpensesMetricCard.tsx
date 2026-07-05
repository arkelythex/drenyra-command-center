import type React from "react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
	title: string;
	value: string;
	hint: string;
	icon: React.ComponentType<{ size?: number; className?: string }>;
}

export function ExpensesMetricCard({
	title,
	value,
	hint,
	icon: Icon,
}: MetricCardProps) {
	return (
		<Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<p className="text-sm font-medium text-muted-foreground">{title}</p>
				<Icon size={16} className="text-muted-foreground" aria-hidden="true" />
			</div>
			<p className="text-2xl font-semibold tracking-tight text-foreground">
				{value}
			</p>
			<p className="mt-1 text-sm text-muted-foreground">{hint}</p>
		</Card>
	);
}
