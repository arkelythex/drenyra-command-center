import type { HubArtifact } from "@drenyra/shared/artifacts";
import { TrendingUp } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type CashflowProjectionArt = Extract<
	HubArtifact,
	{ type: "cashflow_projection" }
>;

const CurrencyFormatter = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
	minimumFractionDigits: 0,
});

function formatMoney(amount: number): string {
	return CurrencyFormatter.format(amount);
}

/**
 * Simple CSS bar chart for cashflow projection.
 * Inline SVG would be heavier; CSS bars are enough for an MVP artifact.
 */
function ProjectionBar({
	point,
	max,
}: {
	point: { period: string; inflow: number; outflow: number; balance: number };
	max: number;
}) {
	const inWidth = (point.inflow / max) * 100;
	const outWidth = (point.outflow / max) * 100;
	const balanceColor =
		point.balance >= 0
			? "text-[var(--premium-success)]"
			: "text-[var(--premium-danger)]";
	const barColor =
		point.balance >= 0
			? "bg-[var(--premium-success)]/30"
			: "bg-[var(--premium-danger)]/30";
	const fillColor =
		point.balance >= 0
			? "bg-[var(--premium-success)]"
			: "bg-[var(--premium-danger)]";

	return (
		<div className="mb-4">
			<div className="mb-1 flex items-center justify-between">
				<span className="text-2xs font-semibold uppercase tracking-wider text-foreground/70">
					{point.period}
				</span>
				<span className={cn("text-xs font-bold font-mono", balanceColor)}>
					{formatMoney(point.balance)}
				</span>
			</div>
			<div className="space-y-1">
				{/* Inflow bar */}
				<div className="flex items-center gap-2">
					<span className="w-10 text-right text-2xs text-[var(--premium-success)]">
						{formatMoney(point.inflow)}
					</span>
					<div className="flex-1 h-3 rounded-full bg-[var(--surface-3)]">
						<div
							className="h-full rounded-full bg-[var(--premium-success)]/40"
							style={{ width: `${Math.max(inWidth, 2)}%` }}
						/>
					</div>
				</div>
				{/* Outflow bar */}
				<div className="flex items-center gap-2">
					<span className="w-10 text-right text-2xs text-[var(--premium-danger)]">
						{formatMoney(point.outflow)}
					</span>
					<div className="flex-1 h-3 rounded-full bg-[var(--surface-3)]">
						<div
							className="h-full rounded-full bg-[var(--premium-danger)]/40"
							style={{ width: `${Math.max(outWidth, 2)}%` }}
						/>
					</div>
				</div>
				{/* Net balance indicator */}
				<div className="mt-0.5 h-1.5 rounded-full bg-[var(--surface-3)]">
					<div
						className={cn("h-full rounded-full transition-all", barColor)}
						style={{
							width: `${Math.max(Math.abs(point.balance / max) * 100, 1)}%`,
							marginLeft:
								point.balance >= 0
									? `${((max - point.balance) / max) * 50}%`
									: `${((max + point.balance) / max) * 50}%`,
						}}
					>
						<div
							className={cn("h-full rounded-full", fillColor)}
							style={{ width: `${Math.abs(point.balance / max) * 100}%` }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export const CashflowProjectionArtifact: React.FC<{
	artifact: CashflowProjectionArt;
}> = ({ artifact }) => {
	const { projections, currentBalance, currency, summary } = artifact.payload;
	const max = Math.max(
		...projections.flatMap((p) => [p.inflow, p.outflow, Math.abs(p.balance)]),
		1,
	);
	const projectedBalance =
		projections.length > 0
			? projections[projections.length - 1].balance
			: currentBalance;
	const isHealthy = projectedBalance >= 0;

	return (
		<div
			className={cn(
				tokensToClasses.borderRadius("card"),
				"mt-6 border border-border/40 bg-foreground/[0.03] p-6",
			)}
		>
			<header className="mb-5 flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-background/60">
					<TrendingUp size={18} />
				</div>
				<div>
					<h4 className="text-sm font-black uppercase tracking-tight text-foreground">
						{artifact.title}
					</h4>
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						Proyección de flujo · {currency}
					</p>
				</div>
			</header>

			{/* Status banner */}
			<div
				className={cn(
					"mb-5 rounded-xl border p-4",
					isHealthy
						? "border-[var(--premium-success)]/20 bg-[var(--premium-success)]/5"
						: "border-[var(--premium-danger)]/20 bg-[var(--premium-danger)]/5",
				)}
			>
				<div className="flex items-baseline justify-between">
					<div>
						<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
							Balance actual
						</p>
						<p className="text-lg font-bold text-foreground">
							{formatMoney(currentBalance)}
						</p>
					</div>
					<div className="text-right">
						<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
							Proyección neta
						</p>
						<p
							className={cn(
								"text-lg font-bold",
								isHealthy
									? "text-[var(--premium-success)]"
									: "text-[var(--premium-danger)]",
							)}
						>
							{formatMoney(summary.netProjection)}
						</p>
					</div>
				</div>
			</div>

			{/* Projection bars */}
			<div className="space-y-2">
				{projections.map((point) => (
					<ProjectionBar key={point.period} point={point} max={max} />
				))}
			</div>

			{/* Summary row */}
			<div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/20 pt-4">
				<div>
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Total ingresos
					</p>
					<p className="mt-0.5 text-sm font-bold text-[var(--premium-success)]">
						{formatMoney(summary.totalInflow)}
					</p>
				</div>
				<div>
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Total egresos
					</p>
					<p className="mt-0.5 text-sm font-bold text-[var(--premium-danger)]">
						{formatMoney(summary.totalOutflow)}
					</p>
				</div>
				<div>
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Flujo neto
					</p>
					<p
						className={cn(
							"mt-0.5 text-sm font-bold",
							summary.netProjection >= 0
								? "text-[var(--premium-success)]"
								: "text-[var(--premium-danger)]",
						)}
					>
						{formatMoney(summary.netProjection)}
					</p>
				</div>
			</div>
		</div>
	);
};

registerArtifact("cashflow_projection", CashflowProjectionArtifact);
