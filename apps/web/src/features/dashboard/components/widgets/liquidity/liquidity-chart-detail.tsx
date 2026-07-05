import { Text } from "@/components/atoms/text";
import { cn } from "@/lib/utils";
import {
	type LiquidityPoint,
	PEN_FORMATTER,
	PERCENT_FORMATTER,
} from "./liquidity-chart.constants";

interface ActiveDetailPanelProps {
	activePoint: LiquidityPoint;
}

export const ActiveDetailPanel = ({ activePoint }: ActiveDetailPanelProps) => (
	<div className="ui-card-surface rounded-2xl p-4">
		<Text
			variant="label"
			className="mb-3 block text-2xs uppercase tracking-[0.14em] text-muted-foreground"
		>
			Corte activo
		</Text>
		<div className="space-y-4">
			<div>
				<Text variant="label" className="block text-2xs text-muted-foreground">
					Flujo real
				</Text>
				<Text
					variant="body"
					className="text-lg font-semibold tracking-tight text-foreground"
				>
					{PEN_FORMATTER.format(activePoint.cash)}
				</Text>
			</div>
			<div>
				<Text variant="label" className="block text-2xs text-muted-foreground">
					Proyectado
				</Text>
				<Text
					variant="body"
					className="text-lg font-semibold tracking-tight text-foreground"
				>
					{PEN_FORMATTER.format(activePoint.projected)}
				</Text>
			</div>
			<div>
				<Text variant="label" className="block text-2xs text-muted-foreground">
					Desviación
				</Text>
				<Text
					variant="body"
					className={cn(
						"text-lg font-semibold tracking-tight",
						activePoint.deltaPct >= 0 ? "text-success" : "text-danger",
					)}
				>
					{activePoint.deltaPct >= 0 ? "+" : ""}
					{PERCENT_FORMATTER.format(activePoint.deltaPct)}%
				</Text>
			</div>
			<div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
				<Text variant="label" className="block text-2xs text-muted-foreground">
					Diferencia nominal
				</Text>
				<Text
					variant="body"
					className="mt-1 font-semibold tracking-tight text-foreground"
				>
					{PEN_FORMATTER.format(activePoint.delta)}
				</Text>
			</div>
			<div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
				<Text variant="label" className="block text-2xs text-muted-foreground">
					Punto observado
				</Text>
				<Text
					variant="body"
					className="mt-1 font-medium tracking-tight text-foreground"
				>
					{activePoint.month} 2026
				</Text>
			</div>
		</div>
	</div>
);
