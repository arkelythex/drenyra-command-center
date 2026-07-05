import { useCallback, useMemo, useState } from "react";

export type ReportType = "pnl" | "balance" | "cashflow" | "equity";

export interface FinancialLine {
	id: string;
	label: string;
	amount: number;
	level: number;
	isTotal?: boolean;
	accounts?: string[]; // Cuentas PCGE vinculadas para el drill-down
}

export const useFinancialsEngine = () => {
	const [activeReport, setActiveReport] = useState<ReportType>("pnl");
	const [drillDownId, setDrillDownId] = useState<string | null>(null);
	const [period, setPeriod] = useState("2025-01");

	const openDrillDown = useCallback((id: string) => {
		setDrillDownId(id);
	}, []);

	const closeDrillDown = useCallback(() => {
		setDrillDownId(null);
	}, []);

	// Simulación de datos dinámicos NIIF
	const reportData = useMemo(() => {
		if (activeReport === "pnl") {
			return [
				{
					id: "rev",
					label: "Ventas Netas",
					amount: 450000,
					level: 0,
					accounts: ["701", "704"],
				},
				{
					id: "cos",
					label: "Costo de Ventas",
					amount: -280000,
					level: 0,
					accounts: ["691"],
				},
				{
					id: "gp",
					label: "Utilidad Bruta",
					amount: 170000,
					level: 0,
					isTotal: true,
				},
				{
					id: "adm",
					label: "Gastos Administrativos",
					amount: -45000,
					level: 1,
					accounts: ["94"],
				},
				{
					id: "sel",
					label: "Gastos de Ventas",
					amount: -32000,
					level: 1,
					accounts: ["95"],
				},
				{
					id: "op",
					label: "Utilidad Operativa",
					amount: 93000,
					level: 0,
					isTotal: true,
				},
			];
		}
		return [];
	}, [activeReport]);

	return {
		activeReport,
		setActiveReport,
		drillDownId,
		openDrillDown,
		closeDrillDown,
		reportData,
		period,
		setPeriod,
	};
};
