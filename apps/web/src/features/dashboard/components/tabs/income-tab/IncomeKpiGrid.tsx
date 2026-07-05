import {
	CheckCircle2,
	CircleDollarSign,
	Clock3,
	FileSpreadsheet,
} from "lucide-react";
import type React from "react";
import { Card } from "@/components/ui/card";
import { formatPEN } from "@/lib/utils";
import type { DashboardIncomeResponse } from "../../../api/dashboard.api";

function KPI({
	title,
	value,
	hint,
	icon: Icon,
}: {
	title: string;
	value: string;
	hint: string;
	icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
	return (
		<Card className="rounded-2xl border border-border/40 bg-white p-5 shadow-sm">
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

export function IncomeKpiGrid({ income }: { income: DashboardIncomeResponse }) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
			<KPI
				title="Total facturado"
				value={formatPEN(income.totalBilled)}
				hint={`${income.invoiceCount} comprobantes emitidos`}
				icon={CircleDollarSign}
			/>
			<KPI
				title="Monto cobrado"
				value={formatPEN(income.collected)}
				hint="Ingresos efectivamente percibidos"
				icon={CheckCircle2}
			/>
			<KPI
				title="Pendiente de cobro"
				value={formatPEN(income.pending + income.overdue)}
				hint={`${formatPEN(income.overdue)} vencido`}
				icon={Clock3}
			/>
			<KPI
				title="Ratio de cobranza"
				value={`${income.collectionRate.toFixed(1)}%`}
				hint={
					income.collectionRate >= 90
						? "Cobranza saludable"
						: "Monitorear cartera"
				}
				icon={FileSpreadsheet}
			/>
		</div>
	);
}
