import type { FiscalRiskLevel } from "@drenyra/domain/drenyra";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Info,
	ShieldAlert,
	XCircle,
} from "lucide-react";
import { createElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────────

export interface FiscalRiskAlert {
	id: string;
	title: string;
	description?: string;
	riskLevel: FiscalRiskLevel;
	category?: string;
	actionLabel?: string;
	actionTo?: string;
}

export interface FiscalRiskLayerProps {
	/** Risk alerts to display */
	alerts: FiscalRiskAlert[];
	/** Summary/aggregate risk level for the page */
	overallRisk?: FiscalRiskLevel | null;
	/** Page content wrapped by the risk layer */
	children: ReactNode;
	/** Show compact mode (no descriptions) */
	compact?: boolean;
}

// ── Color mapping ──────────────────────────────────────────────────────────────

const RISK_COLORS: Record<
	FiscalRiskLevel,
	{
		border: string;
		bg: string;
		text: string;
		dot: string;
		icon: typeof AlertTriangle;
	}
> = {
	LOW: {
		border: "border-[var(--color-success)]/20",
		bg: "bg-[var(--color-success)]/5",
		text: "text-[var(--color-success)]",
		dot: "bg-[var(--color-success)]",
		icon: CheckCircle2,
	},
	MEDIUM: {
		border: "border-[var(--color-warning)]/20",
		bg: "bg-[var(--color-warning)]/5",
		text: "text-[var(--color-warning)]",
		dot: "bg-[var(--color-warning)]",
		icon: AlertTriangle,
	},
	HIGH: {
		border: "border-[var(--color-danger)]/20",
		bg: "bg-[var(--color-danger)]/5",
		text: "text-[var(--color-danger)]",
		dot: "bg-[var(--color-danger)]",
		icon: ShieldAlert,
	},
	CRITICAL: {
		border: "border-red-800/30",
		bg: "bg-red-950/10",
		text: "text-red-700 dark:text-red-400",
		dot: "bg-red-700 dark:bg-red-400",
		icon: XCircle,
	},
};

// ── Risk Badge (standalone) ────────────────────────────────────────────────────

export function FiscalRiskBadge({
	riskLevel,
	score,
	compact = false,
}: {
	riskLevel: FiscalRiskLevel;
	score?: number;
	compact?: boolean;
}) {
	const colors = RISK_COLORS[riskLevel];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border px-2 py-1 text-2xs font-bold",
				colors.border,
				colors.bg,
				colors.text,
			)}
		>
			{createElement(colors.icon, { size: 10 })}
			{riskLevel}
			{!compact && typeof score === "number" ? ` · ${score}` : ""}
		</span>
	);
}

// ── Risk Layer (page wrapper) ──────────────────────────────────────────────────

export function FiscalRiskLayer({
	alerts,
	overallRisk,
	children,
	compact = false,
}: FiscalRiskLayerProps) {
	const hasAlerts = alerts.length > 0;
	const riskCounts = {
		CRITICAL: alerts.filter((a) => a.riskLevel === "CRITICAL").length,
		HIGH: alerts.filter((a) => a.riskLevel === "HIGH").length,
		MEDIUM: alerts.filter((a) => a.riskLevel === "MEDIUM").length,
		LOW: alerts.filter((a) => a.riskLevel === "LOW").length,
	};

	return (
		<div className="flex flex-1 flex-col">
			{/* ── Risk summary strip ── */}
			{hasAlerts && (
				<div
					className={cn(
						"flex items-center gap-4 border-b px-4 py-2 text-xs",
						"border-[var(--border-subtle)] bg-[var(--surface-2)]",
					)}
				>
					{overallRisk ? (
						<FiscalRiskBadge riskLevel={overallRisk} compact />
					) : null}
					{riskCounts.CRITICAL > 0 && (
						<span className="font-medium text-red-700 dark:text-red-400">
							{riskCounts.CRITICAL} crítico
							{riskCounts.CRITICAL !== 1 ? "s" : ""}
						</span>
					)}
					{riskCounts.HIGH > 0 && (
						<span className="font-medium text-[var(--color-danger)]">
							{riskCounts.HIGH} alto
							{riskCounts.HIGH !== 1 ? "s" : ""}
						</span>
					)}
					{riskCounts.MEDIUM > 0 && (
						<span className="text-[var(--color-warning)]">
							{riskCounts.MEDIUM} medio
							{riskCounts.MEDIUM !== 1 ? "s" : ""}
						</span>
					)}
					{riskCounts.LOW > 0 && (
						<span className="text-[var(--color-success)]">
							{riskCounts.LOW} bajo
							{riskCounts.LOW !== 1 ? "s" : ""}
						</span>
					)}
					<span className="ml-auto text-[var(--text-muted)]">
						{hasAlerts
							? `${alerts.length} alerta${alerts.length !== 1 ? "s" : ""}`
							: ""}
					</span>
				</div>
			)}

			{/* ── Alert cards ── */}
			{hasAlerts && (
				<div className={cn("space-y-1.5 p-4 pb-0", compact && "p-2 pb-0")}>
					{alerts.slice(0, compact ? 3 : alerts.length).map((alert) => {
						const colors = RISK_COLORS[alert.riskLevel];
						return (
							<div
								key={alert.id}
								className={cn(
									"flex items-start gap-3 rounded-lg border p-3",
									colors.border,
									colors.bg,
								)}
							>
								{createElement(colors.icon, {
									size: 14,
									className: cn("mt-0.5 shrink-0", colors.text),
								})}
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-2">
										<p className="text-xs font-semibold text-[var(--text-primary)]">
											{alert.title}
										</p>
										{!compact && alert.category && (
											<span className="shrink-0 rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
												{alert.category}
											</span>
										)}
									</div>
									{!compact && alert.description && (
										<p className="mt-0.5 text-2xs text-[var(--text-tertiary)] leading-relaxed">
											{alert.description}
										</p>
									)}
									{alert.actionLabel && (
										<button
											type="button"
											onClick={() => {
												if (alert.actionTo) {
													window.location.href = alert.actionTo;
												}
											}}
											className="mt-1 inline-flex items-center gap-1 text-2xs font-medium text-[var(--color-primary)] hover:underline"
										>
											{alert.actionLabel}
											<ArrowRight size={10} />
										</button>
									)}
								</div>
							</div>
						);
					})}
					{compact && alerts.length > 3 && (
						<button
							type="button"
							className="flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] py-2 text-2xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
						>
							<Info size={10} />+{alerts.length - 3} alertas más
						</button>
					)}
				</div>
			)}

			{/* ── Main content ── */}
			<div className="flex-1">{children}</div>
		</div>
	);
}
