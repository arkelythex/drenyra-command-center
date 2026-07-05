import type {
	SireSummary,
	SireSummaryCardData,
	SireTableRowData,
} from "./sire-management.types";

export const FALLBACK_SIRE_DEMO_SUMMARY: SireSummary = {
	period: "2026-03",
	sunatCount: 4,
	systemCount: 3,
	differenceCount: 0,
	totalAmount: 18340.5,
};

export function buildSireSummaryCards(
	summary: SireSummary,
): SireSummaryCardData[] {
	return [
		{
			icon: "sales",
			title: "RVIE - Ventas",
			badge: `${summary.sunatCount} Verificados`,
			count: summary.sunatCount,
			unit: "Registros RVIE",
			variant: "default",
		},
		{
			icon: "purchases",
			title: "RCE - Compras",
			badge: `${summary.systemCount} Verificados`,
			count: summary.systemCount,
			unit: "Registros RCE",
			variant: "default",
		},
		{
			icon: "differences",
			title: "Diferencias",
			badge:
				summary.differenceCount === 0
					? "Sin Alertas"
					: `${summary.differenceCount} Alertas`,
			count: summary.differenceCount,
			unit: "Discrepancias",
			variant: "alert",
		},
	];
}

export function buildSireSummaryPlaceholderCards(
	mode: "loading" | "error",
): SireSummaryCardData[] {
	const badge = mode === "loading" ? "Cargando" : "Sin datos";
	const unit =
		mode === "loading" ? "Esperando resumen" : "Resumen no disponible";

	return [
		{
			icon: "sales",
			title: "RVIE - Ventas",
			badge,
			count: "—",
			unit,
			variant: "default",
		},
		{
			icon: "purchases",
			title: "RCE - Compras",
			badge,
			count: "—",
			unit,
			variant: "default",
		},
		{
			icon: "differences",
			title: "Diferencias",
			badge,
			count: "—",
			unit,
			variant: "alert",
		},
	];
}

export const SIRE_TABLE_ROWS: SireTableRowData[] = [
	{
		icon: "file",
		id: "F001-0000101",
		provider: "Cliente Demo Retail SAC",
		sunatStatus: "Sincronizado",
		internalStatus: "Registrado",
		amount: "S/ 4,250.00",
		date: "04 MAR",
	},
	{
		icon: "file",
		id: "F001-0000102",
		provider: "Operador Logistico Andino E.I.R.L.",
		sunatStatus: "Sincronizado",
		internalStatus: "Registrado",
		amount: "S/ 2,980.00",
		date: "08 MAR",
	},
	{
		icon: "file",
		id: "F001-0000103",
		provider: "Servicios Industriales del Pacífico SAC",
		sunatStatus: "Sincronizado",
		internalStatus: "Registrado",
		amount: "S/ 3,610.00",
		date: "13 MAR",
	},
	{
		icon: "file",
		id: "F001-0000104",
		provider: "Consultoria Fiscal Norte SAC",
		sunatStatus: "Sincronizado",
		internalStatus: "Registrado",
		amount: "S/ 1,900.00",
		date: "21 MAR",
	},
	{
		icon: "file",
		id: "E001-000021",
		provider: "Proveedor Combustible Centro SAC",
		sunatStatus: "Registrado",
		internalStatus: "Registrado",
		amount: "S/ 1,240.00",
		date: "07 MAR",
	},
	{
		icon: "file",
		id: "B001-000145",
		provider: "Tecnologia Operativa del Sur SAC",
		sunatStatus: "Registrado",
		internalStatus: "Registrado",
		amount: "S/ 2,140.00",
		date: "15 MAR",
	},
	{
		icon: "file",
		id: "B001-000146",
		provider: "Servicios Administrativos Miraflores E.I.R.L.",
		sunatStatus: "Registrado",
		internalStatus: "Registrado",
		amount: "S/ 2,220.50",
		date: "26 MAR",
	},
];
