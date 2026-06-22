import { motion } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	Clock,
	XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RunSummary } from "../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function summaryCardItems(summary: RunSummary | undefined) {
	if (!summary) return [];
	return [
		{
			label: "Total Runs",
			value: summary.total,
			color: "text-[var(--text-primary)]",
			icon: BarChart3,
		},
		{
			label: "Running",
			value: summary.running,
			color: "text-[var(--color-info)]",
			icon: Clock,
		},
		{
			label: "Completed",
			value: summary.completed,
			color: "text-[var(--color-success)]",
			icon: CheckCircle2,
		},
		{
			label: "Failed",
			value: summary.failed,
			color: "text-[var(--color-danger)]",
			icon: XCircle,
		},
		{
			label: "Manual Review",
			value: summary.manualReview,
			color: "text-[var(--color-warning)]",
			icon: AlertTriangle,
		},
		{
			label: "Degraded",
			value: summary.degraded,
			color: "text-[var(--text-tertiary)]",
			icon: Activity,
		},
	];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

export function SummaryCardSkeleton() {
	return (
		<Card variant="glass" padding="md">
			<CardContent className="flex flex-col items-center gap-2 p-0">
				<Skeleton className="h-8 w-16 rounded-md" />
				<Skeleton className="h-4 w-24" />
			</CardContent>
		</Card>
	);
}

export function StatusCard({
	label,
	value,
	color,
	icon: Icon,
	index,
}: {
	label: string;
	value: number;
	color: string;
	icon: React.FC<{ className?: string }>;
	index: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
		>
			<Card variant="glass" padding="md" animateOnHover>
				<CardContent className="flex flex-col items-center gap-2 p-0">
					<Icon className={cn("h-5 w-5", color)} />
					<span className="font-mono tabular-nums text-2xl font-bold text-[var(--text-primary)]">
						{value}
					</span>
					<span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
						{label}
					</span>
				</CardContent>
			</Card>
		</motion.div>
	);
}
