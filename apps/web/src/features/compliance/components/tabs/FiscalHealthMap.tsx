"use client";

import {
	AlertTriangle,
	DollarSign,
	Eye,
	Gauge,
	type LucideIcon,
	Target,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RISK_FILTERS, type RiskFilter } from "./fiscal-health-map/config";
import { MOCK_CONTRIBUTORS, MOCK_RISKS } from "./fiscal-health-map/data";
import {
	ContributorHealthCard,
	RiskCard,
	RiskHeatMap,
} from "./fiscal-health-map/widgets";

interface StatCardProps {
	icon: LucideIcon;
	label: string;
	title: string;
	value: string;
	tone: "red" | "amber" | "emerald" | "blue";
}

const statToneStyles = {
	red: {
		border: "border-danger-subtle",
		text: "text-danger",
		badge: "bg-danger-muted",
	},
	amber: {
		border: "border-warning-subtle",
		text: "text-warning",
		badge: "bg-warning-muted",
	},
	emerald: {
		border: "border-success-subtle",
		text: "text-success",
		badge: "bg-success-muted",
	},
	blue: {
		border: "border-info-subtle",
		text: "text-info",
		badge: "bg-info-muted",
	},
} as const;

function StatCard({ icon: Icon, label, title, value, tone }: StatCardProps) {
	const toneStyle = statToneStyles[tone];

	return (
		<Card
			className={cn("border-border/40 bg-card/70 shadow-sm", toneStyle.border)}
		>
			<CardContent className="p-4">
				<div className="mb-2 flex items-center justify-between">
					<Icon className={cn("h-5 w-5", toneStyle.text)} />
					<span
						className={cn(
							"rounded px-2 py-0.5 text-xs font-bold",
							toneStyle.text,
							toneStyle.badge,
						)}
					>
						{label}
					</span>
				</div>
				<p className="text-2xl font-black text-foreground">{value}</p>
				<p className="text-2xs uppercase text-muted-foreground">{title}</p>
			</CardContent>
		</Card>
	);
}

export function FiscalHealthMap() {
	const [filter, setFilter] = useState<RiskFilter>("all");

	const filteredRisks = useMemo(
		() =>
			filter === "all"
				? MOCK_RISKS
				: MOCK_RISKS.filter((risk) => risk.severity === filter),
		[filter],
	);

	const criticalCount = MOCK_RISKS.filter(
		(risk) => risk.severity === "critical",
	).length;
	const totalExposure = MOCK_RISKS.reduce(
		(sum, risk) => sum + (risk.amount ?? 0),
		0,
	);
	const avgProbability = Math.round(
		MOCK_RISKS.reduce((sum, risk) => sum + risk.probability, 0) /
			MOCK_RISKS.length,
	);

	return (
		<div className="space-y-6 animate-entrance pb-20">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<StatCard
					icon={AlertTriangle}
					label="CRITICO"
					title="Riesgos Criticos"
					value={String(criticalCount)}
					tone="red"
				/>
				<StatCard
					icon={Target}
					label="PROMEDIO"
					title="Probabilidad Promedio"
					value={`${avgProbability}%`}
					tone="amber"
				/>
				<StatCard
					icon={DollarSign}
					label="EXPOSICION"
					title="Monto en Riesgo"
					value={`S/ ${(totalExposure / 1000).toFixed(1)}k`}
					tone="emerald"
				/>
				<StatCard
					icon={Gauge}
					label="SCORE"
					title="Salud Fiscal"
					value="72.5"
					tone="blue"
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card className="border-border/40 bg-card/70 shadow-sm lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Eye className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-bold">
									Mapa de Calor de Riesgos
								</span>
							</div>
							<div className="flex gap-2">
								{RISK_FILTERS.map((option) => (
									<button
										key={option}
										onClick={() => setFilter(option)}
										className={cn(
											"rounded px-2 py-1 text-2xs font-bold uppercase transition-[background-color,color] duration-200",
											filter === option
												? "bg-foreground text-background"
												: "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
										)}
									>
										{option === "all" ? "Todos" : option}
									</button>
								))}
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<RiskHeatMap risks={filteredRisks} />
					</CardContent>
				</Card>

				<Card className="border-border/40 bg-card/70 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-bold">
								Estado de Contribuyentes
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="max-h-[300px] space-y-2 overflow-y-auto">
						{MOCK_CONTRIBUTORS.map((contributor) => (
							<ContributorHealthCard
								key={contributor.ruc}
								contributor={contributor}
							/>
						))}
					</CardContent>
				</Card>
			</div>

			<section>
				<h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
					<AlertTriangle className="h-4 w-4 text-warning" />
					Riesgos identificados · Revisión fiscal
				</h3>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					{filteredRisks.map((risk, index) => (
						<RiskCard key={risk.id} risk={risk} index={index} />
					))}
				</div>
			</section>
		</div>
	);
}
