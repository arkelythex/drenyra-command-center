"use client";

import { useState } from "react";
import { cn, n } from "@/lib/utils";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { BarChart3, TrendingUp, DollarSign, PieChart } from "lucide-react";

type ReportType = "balance" | "income" | "cashflow";

interface ReportConfig {
	id: ReportType;
	label: string;
	icon: typeof BarChart3;
	description: string;
}

const REPORTS: ReportConfig[] = [
	{
		id: "balance",
		label: "Balance General",
		icon: PieChart,
		description: "Activos, Pasivos y Patrimonio",
	},
	{
		id: "income",
		label: "Estado de Resultados",
		icon: TrendingUp,
		description: "Ingresos y Gastos",
	},
	{
		id: "cashflow",
		label: "Flujo de Efectivo",
		icon: DollarSign,
		description: "Efectivo neto operativo",
	},
];

// Mock data for each report type
const MOCK_DATA: Record<
	ReportType,
	Array<{
		name: string;
		value: number;
		previousValue?: number;
		isTotal?: boolean;
		isNegative?: boolean;
	}>
> = {
	balance: [
		{ name: "Efectivo y Bancos", value: 2840000, previousValue: 3100000 },
		{ name: "Cuentas por Cobrar", value: 1890000, previousValue: 1650000 },
		{ name: "Inventarios", value: 950000, previousValue: 890000 },
		{ name: "Activo Fijo Neto", value: 4200000, previousValue: 4150000 },
		{
			name: "Total Activo",
			value: 9880000,
			previousValue: 9790000,
			isTotal: true,
		},
		{
			name: "Cuentas por Pagar",
			value: 1250000,
			previousValue: 1100000,
			isNegative: true,
		},
		{
			name: "Deuda Bancaria",
			value: 2100000,
			previousValue: 2300000,
			isNegative: true,
		},
		{
			name: "Total Pasivo",
			value: 3350000,
			previousValue: 3400000,
			isTotal: true,
			isNegative: true,
		},
		{ name: "Capital", value: 5000000, previousValue: 5000000 },
		{ name: "Resultados Acumulados", value: 1530000, previousValue: 1390000 },
		{
			name: "Total Patrimonio",
			value: 6530000,
			previousValue: 6390000,
			isTotal: true,
		},
	],
	income: [
		{ name: "Ventas Netas", value: 8900000, previousValue: 8200000 },
		{
			name: "Costo de Ventas",
			value: -5340000,
			previousValue: -4920000,
			isNegative: true,
		},
		{
			name: "Utilidad Bruta",
			value: 3560000,
			previousValue: 3280000,
			isTotal: true,
		},
		{
			name: "Gastos Operativos",
			value: -1850000,
			previousValue: -1720000,
			isNegative: true,
		},
		{ name: "EBITDA", value: 1710000, previousValue: 1560000, isTotal: true },
		{
			name: "Depreciación",
			value: -320000,
			previousValue: -310000,
			isNegative: true,
		},
		{
			name: "Utilidad Operativa",
			value: 1390000,
			previousValue: 1250000,
			isTotal: true,
		},
		{
			name: "Gastos Financieros",
			value: -180000,
			previousValue: -195000,
			isNegative: true,
		},
		{
			name: "Utilidad Neta",
			value: 1210000,
			previousValue: 1055000,
			isTotal: true,
		},
	],
	cashflow: [
		{ name: "Cobranzas", value: 8700000 },
		{ name: "Pagos a Proveedores", value: -5200000, isNegative: true },
		{ name: "Flujo Operativo", value: 3500000, isTotal: true },
		{ name: "Compra de Activos", value: -450000, isNegative: true },
		{ name: "Flujo de Inversión", value: -450000, isTotal: true },
		{ name: "Préstamos", value: 1000000 },
		{ name: "Dividendos", value: -400000, isNegative: true },
		{ name: "Flujo de Financiamiento", value: 600000, isTotal: true },
		{ name: "Variación Neta", value: 3650000, isTotal: true },
		{ name: "Saldo Inicial", value: 1200000 },
		{ name: "Saldo Final", value: 4850000, isTotal: true },
	],
};

function ReportSection({ report }: { report: (typeof MOCK_DATA)[ReportType] }) {
	return (
		<div className="space-y-1">
			{report.map((item, i) => (
				<div
					key={i}
					className={cn(
						"flex items-center justify-between rounded-lg px-3 py-1.5 text-xs",
						item.isTotal &&
							"border-t border-[var(--border-subtle)] bg-[var(--surface-2)]/50 font-semibold",
						!item.isTotal && "hover:bg-[var(--surface-2)]/30",
					)}
				>
					<span
						className={cn(
							"truncate",
							item.isTotal
								? "text-[var(--text-primary)]"
								: "text-[var(--text-secondary)]",
							item.isNegative &&
								!item.isTotal &&
								"text-[var(--color-danger)]/80",
						)}
					>
						{item.name}
					</span>
					<span
						className={cn(
							"ml-4 font-mono tabular-nums tracking-tight whitespace-nowrap",
							item.isTotal
								? "text-[var(--text-primary)]"
								: "text-[var(--text-secondary)]",
							item.value < 0 && "text-[var(--color-danger)]",
						)}
					>
						{n(item.value)}
					</span>
				</div>
			))}
		</div>
	);
}

export function ReportPreview() {
	const { companyContext, fiscalPeriod, formatFiscalPeriodLabel } =
		useActiveCompanyContext();
	const [activeReport, setActiveReport] = useState<ReportType>("balance");

	const report = MOCK_DATA[activeReport];
	const reportConfig = REPORTS.find((r) => r.id === activeReport)!;

	return (
		<div className="flex h-full flex-col">
			{/* Report selector */}
			<div className="flex border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50">
				{REPORTS.map((r) => (
					<button
						key={r.id}
						onClick={() => setActiveReport(r.id)}
						className={cn(
							"flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors",
							activeReport === r.id
								? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
								: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
						)}
					>
						<r.icon size={13} />
						<span className="hidden sm:inline">{r.label}</span>
					</button>
				))}
			</div>

			{/* Report header */}
			<div className="border-b border-[var(--border-subtle)] px-4 py-3">
				<h3 className="text-sm font-semibold text-[var(--text-primary)]">
					{reportConfig.label}
				</h3>
				<p className="text-2xs text-[var(--text-muted)] mt-0.5">
					{companyContext.companyName} ·{" "}
					{fiscalPeriod
						? formatFiscalPeriodLabel(fiscalPeriod)
						: "Período actual"}
				</p>
			</div>

			{/* Report content */}
			<div className="flex-1 overflow-y-auto p-3">
				<ReportSection report={report} />
			</div>

			{/* Footer */}
			<div className="border-t border-[var(--border-subtle)] px-4 py-2">
				<p className="text-2xs text-[var(--text-muted)] text-center">
					Valores en soles (S/) · Cifras preliminares
				</p>
			</div>
		</div>
	);
}
