import type { FiscalRiskLevel } from "@drenyra/domain/drenyra";
import {
	ArrowRight,
	CircleAlert,
	CircleCheck,
	CircleX,
	type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FiscalRiskAlert {
	id: string;
	title: string;
	description?: string;
	riskLevel: FiscalRiskLevel;
	category?: string;
	actionLabel?: string;
	/** Where the action goes; without it the action is not shown. */
	actionTo?: string;
}

export interface FiscalRiskLayerProps {
	alerts: FiscalRiskAlert[];
	/** Aggregate risk of the page, shown next to the counts. */
	overallRisk?: FiscalRiskLevel | null | undefined;
	children: ReactNode;
}

interface LevelStyle {
	icon: LucideIcon;
	tone: string;
	/** Level as a word, singular and plural, so state never depends on color. */
	singular: string;
	plural: string;
	label: string;
}

const LEVEL_ORDER: FiscalRiskLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const LEVELS: Record<FiscalRiskLevel, LevelStyle> = {
	CRITICAL: {
		icon: CircleX,
		tone: "text-destructive",
		singular: "crítico",
		plural: "críticos",
		label: "Crítico",
	},
	HIGH: {
		icon: CircleAlert,
		tone: "text-destructive",
		singular: "alto",
		plural: "altos",
		label: "Alto",
	},
	MEDIUM: {
		icon: CircleAlert,
		tone: "text-warning",
		singular: "medio",
		plural: "medios",
		label: "Medio",
	},
	LOW: {
		icon: CircleCheck,
		tone: "text-success",
		singular: "bajo",
		plural: "bajos",
		label: "Bajo",
	},
};

function countByLevel(alerts: FiscalRiskAlert[]) {
	return LEVEL_ORDER.map((level) => ({
		level,
		count: alerts.filter((alert) => alert.riskLevel === level).length,
	})).filter(({ count }) => count > 0);
}

function RiskSummary({
	alerts,
	overallRisk,
}: {
	alerts: FiscalRiskAlert[];
	overallRisk?: FiscalRiskLevel | null | undefined;
}) {
	const total = alerts.length;
	return (
		<p
			role="status"
			className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-4 py-2 text-sm sm:px-8"
		>
			{overallRisk ? (
				<span className={cn("font-medium", LEVELS[overallRisk].tone)}>
					Riesgo {LEVELS[overallRisk].singular}
				</span>
			) : null}
			<span className="text-foreground">
				{total} alerta{total === 1 ? "" : "s"}
			</span>
			{countByLevel(alerts).map(({ level, count }) => (
				<span key={level} className={LEVELS[level].tone}>
					{count} {count === 1 ? LEVELS[level].singular : LEVELS[level].plural}
				</span>
			))}
		</p>
	);
}

function RiskAlertList({ alerts }: { alerts: FiscalRiskAlert[] }) {
	return (
		<ul
			aria-label="Alertas fiscales"
			className="mx-4 mt-4 divide-y divide-border rounded-xl border border-border bg-card sm:mx-8"
		>
			{alerts.map((alert) => {
				const level = LEVELS[alert.riskLevel];
				const Icon = level.icon;
				return (
					<li key={alert.id} className="flex items-start gap-3 px-4 py-3">
						<Icon
							aria-hidden="true"
							className={cn("mt-0.5 size-4 shrink-0", level.tone)}
						/>
						<div className="min-w-0 flex-1 space-y-0.5">
							<p className="text-sm font-medium">{alert.title}</p>
							{alert.description ? (
								<p className="text-sm text-muted-foreground">
									{alert.description}
								</p>
							) : null}
							{alert.actionLabel && alert.actionTo ? (
								<a
									href={alert.actionTo}
									className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:underline"
								>
									{alert.actionLabel}
									<ArrowRight aria-hidden="true" className="size-3.5" />
								</a>
							) : null}
						</div>
						<span className={cn("shrink-0 text-sm", level.tone)}>
							{level.label}
						</span>
					</li>
				);
			})}
		</ul>
	);
}

/**
 * Page wrapper that puts open fiscal alerts above the content. It is a flex
 * column that may shrink (min-h-0) so the content below scrolls on its own
 * instead of growing the page past the viewport.
 */
export function FiscalRiskLayer({
	alerts,
	overallRisk,
	children,
}: FiscalRiskLayerProps) {
	const hasAlerts = alerts.length > 0;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{hasAlerts ? (
				<RiskSummary alerts={alerts} overallRisk={overallRisk} />
			) : null}
			{hasAlerts ? <RiskAlertList alerts={alerts} /> : null}
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
		</div>
	);
}
