import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import React, { Suspense } from "react";
import { Text } from "@/components/atoms/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardSkeleton } from "@/components/ui/skeleton";

// These should be passed or imported correctly
const SireMatcher = React.lazy(() =>
	import("../widgets/SireMatcher").then((m) => ({ default: m.SireMatcher })),
);
const FiscalIndicators = React.lazy(() =>
	import("../widgets/FiscalIndicators").then((m) => ({
		default: m.FiscalIndicators,
	})),
);
const TaxCalendar = React.lazy(() =>
	import("../widgets/TaxCalendar").then((m) => ({ default: m.TaxCalendar })),
);
const DetraccionesWidget = React.lazy(() =>
	import("../widgets/DetraccionesWidget").then((m) => ({
		default: m.DetraccionesWidget,
	})),
);

interface DashboardAdvancedPanelProps {
	showAdvancedPanel: boolean;
	setShowAdvancedPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DashboardAdvancedPanel: React.FC<DashboardAdvancedPanelProps> = ({
	showAdvancedPanel,
	setShowAdvancedPanel,
}) => {
	return (
		<section aria-labelledby="advanced-panel-title" className="mt-8 space-y-5">
			<Card variant="bordered" padding="none" className="rounded-2xl">
				<CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-[var(--surface-1)] text-foreground">
							<Layers size={20} />
						</div>
						<div>
							<Text
								variant="hero"
								id="advanced-panel-title"
								className="mb-0.5 text-base font-semibold tracking-tight text-foreground"
							>
								Panel avanzado
							</Text>
							<Text
								variant="label"
								className="text-label text-muted-foreground"
							>
								SIRE, calendario tributario e indicadores fiscales
							</Text>
						</div>
					</div>

					<Button
						type="button"
						size="sm"
						variant="outline"
						className="h-10 rounded-xl border-border/70 px-4 text-label font-medium tracking-[0.04em] transition-[background-color,border-color] duration-150 hover:bg-muted/25"
						onClick={() => setShowAdvancedPanel((previous) => !previous)}
					>
						{showAdvancedPanel ? "Contraer panel" : "Ver análisis avanzado"}
						{showAdvancedPanel ? (
							<ChevronUp className="ml-2" size={16} />
						) : (
							<ChevronDown className="ml-2" size={16} />
						)}
					</Button>
				</CardContent>
			</Card>

			{showAdvancedPanel && (
				<div className="ui-deferred-section grid grid-cols-1 gap-5 items-start 2xl:grid-cols-12">
					<div className="2xl:col-span-8 space-y-5">
						<div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
							<Suspense
								fallback={<DashboardCardSkeleton className="h-[400px]" />}
							>
								<SireMatcher />
							</Suspense>
							<Suspense
								fallback={<DashboardCardSkeleton className="h-[400px]" />}
							>
								<FiscalIndicators />
							</Suspense>
						</div>
					</div>

					<div className="2xl:col-span-4 space-y-5">
						<Suspense
							fallback={<DashboardCardSkeleton className="h-[300px]" />}
						>
							<TaxCalendar />
						</Suspense>
						<Suspense
							fallback={<DashboardCardSkeleton className="h-[300px]" />}
						>
							<DetraccionesWidget />
						</Suspense>
					</div>
				</div>
			)}
		</section>
	);
};
