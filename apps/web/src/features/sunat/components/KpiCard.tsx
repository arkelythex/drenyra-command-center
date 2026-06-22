/**
 * KpiCard — KPI metric card with icon, label, value, and tone-based styling.
 *
 * Used by the SUNAT dashboard and reusable across fiscal dashboard views.
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
	icon: LucideIcon;
	label: string;
	value: string;
	tone: "success" | "info" | "warning" | "danger";
}

const TONE_STYLES: Record<KpiCardProps["tone"], string> = {
	success:
		"text-[var(--premium-success)] bg-[var(--premium-success)]/8 border-[var(--premium-success)]/18",
	info: "text-[var(--premium-info)] bg-[var(--premium-info)]/8 border-[var(--premium-info)]/18",
	warning:
		"text-[var(--premium-warning)] bg-[var(--premium-warning)]/8 border-[var(--premium-warning)]/18",
	danger:
		"text-[var(--premium-danger)] bg-[var(--premium-danger)]/8 border-[var(--premium-danger)]/18",
};

export function KpiCard({ icon: Icon, label, value, tone }: KpiCardProps) {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-5 backdrop-blur-sm transition-all hover:border-[var(--border-default)]">
			<div className="mb-3 flex items-center justify-between">
				<p className="text-xs font-medium tracking-wide text-[var(--text-secondary)]">
					{label}
				</p>
				<div
					className={cn(
						"flex h-8 w-8 items-center justify-center rounded-lg border",
						TONE_STYLES[tone],
					)}
				>
					<Icon size={16} aria-hidden="true" />
				</div>
			</div>
			<p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-[var(--text-primary)] leading-none">
				{value}
			</p>
		</div>
	);
}

export function KpiCardSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-5 backdrop-blur-sm">
			<div className="mb-3 flex items-center justify-between">
				<div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
				<div className="h-8 w-8 animate-pulse rounded-lg bg-[var(--surface-2)]" />
			</div>
			<div className="h-8 w-32 animate-pulse rounded bg-[var(--surface-2)]" />
		</div>
	);
}
