import type {
	PreAuditAlert,
	PreAuditRecommendation,
	RiskRule,
	TaxData,
} from "./types";

export const SUNAT_RISK_RULES: RiskRule[] = [
	{
		id: "IGV-001",
		area: "IGV_CREDITO_FISCAL",
		name: "Ratio crédito/débito anómalo",
		description: "El crédito fiscal excede el 90% del débito fiscal",
		condition: (data: TaxData) => {
			if (data.debitoFiscal === 0) return false;
			return data.creditoFiscal / data.debitoFiscal > 0.9;
		},
		severity: "CRITICAL",
		auditImpact: 0.25,
		legalBasis: "Art. 18 Ley del IGV",
	},
	{
		id: "IGV-002",
		area: "IGV_CREDITO_FISCAL",
		name: "Proveedor no habido",
		description: "Facturas de proveedores con condición NO HABIDO en SUNAT",
		condition: (data: TaxData) => data.proveedoresNoHabidos > 0,
		severity: "CRITICAL",
		auditImpact: 0.4,
		legalBasis: "Art. 19 Ley del IGV, inc. b)",
	},
	{
		id: "RENTA-001",
		area: "RENTA_GASTOS",
		name: "Gastos de representación excesivos",
		description: "Gastos de representación superan el 0.5% de ingresos brutos",
		condition: (data: TaxData) => {
			if (data.ingresosBrutos === 0) return false;
			return data.gastosRepresentacion / data.ingresosBrutos > 0.005;
		},
		severity: "WARNING",
		auditImpact: 0.15,
		legalBasis: "Art. 37 inc. q) LIR",
	},
	{
		id: "RENTA-002",
		area: "BANCARIZACION",
		name: "Gastos sin bancarización",
		description: "Pagos mayores a S/ 2,000 sin medio de pago bancario",
		condition: (data: TaxData) => data.gastosSinBancarizar > 200000,
		severity: "CRITICAL",
		auditImpact: 0.3,
		legalBasis: "D.Leg. 939 - Ley de Bancarización",
	},
	{
		id: "INV-001",
		area: "INVENTARIO_VENTAS",
		name: "Discrepancia inventario vs ventas",
		description: "Las ventas declaradas no son consistentes con el inventario",
		condition: (data: TaxData) => {
			if (data.inventarioReal === 0) return false;
			const diff = Math.abs(data.inventarioTeoricoFinal - data.inventarioReal);
			return diff / data.inventarioReal > 0.1;
		},
		severity: "CRITICAL",
		auditImpact: 0.35,
		legalBasis: "Art. 62 Código Tributario - Presunción",
	},
	{
		id: "RATIO-001",
		area: "RATIOS_FINANCIEROS",
		name: "Margen bruto anormalmente bajo",
		description: "El margen bruto está muy por debajo del promedio del sector",
		condition: (data: TaxData) => {
			if (data.margenBrutoSector === 0) return false;
			return data.margenBruto < data.margenBrutoSector * 0.5;
		},
		severity: "CRITICAL",
		auditImpact: 0.3,
		legalBasis: "Art. 65-A Código Tributario - Presunción",
	},
	{
		id: "RATIO-002",
		area: "RATIOS_FINANCIEROS",
		name: "Utilidad negativa persistente",
		description: "La empresa declara pérdidas por 3+ años consecutivos",
		condition: (data: TaxData) => data.aniosConPerdida >= 3,
		severity: "CRITICAL",
		auditImpact: 0.45,
		legalBasis: "Art. 65 Código Tributario",
	},
	{
		id: "RATIO-003",
		area: "RATIOS_FINANCIEROS",
		name: "Margen bruto negativo",
		description: "El costo de ventas supera los ingresos (margen bruto < 0)",
		condition: (data: TaxData) => data.margenBruto < 0,
		severity: "CRITICAL",
		auditImpact: 0.5,
		legalBasis: "Art. 65-A Código Tributario",
	},
	{
		id: "DETR-001",
		area: "DETRACCIONES",
		name: "Detracciones no depositadas",
		description: "Compras con detracción donde el depósito no aparece en ITF",
		condition: (data: TaxData) => data.detraccionesPendientes > 0,
		severity: "CRITICAL",
		auditImpact: 0.4,
		legalBasis: "D.Leg. 940 - Sistema de Detracciones",
	},
];

export function generateRecommendations(
	alerts: PreAuditAlert[],
): PreAuditRecommendation[] {
	const recommendations: PreAuditRecommendation[] = [];

	for (const alert of alerts) {
		const rec = RECOMMENDATION_MAP[alert.id];
		if (rec) {
			recommendations.push({
				id: `REC-${alert.id}`,
				alertId: alert.id,
				...rec,
			});
		}
	}

	const priorityOrder: Record<PreAuditRecommendation["priority"], number> = {
		IMMEDIATE: 0,
		BEFORE_DECLARATION: 1,
		NEXT_PERIOD: 2,
	};
	return recommendations.sort(
		(a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
	);
}

const RECOMMENDATION_MAP: Record<
	string,
	Omit<PreAuditRecommendation, "id" | "alertId">
> = {
	"IGV-001": {
		action:
			"Revisar facturas de compra con crédito fiscal alto. Verificar si corresponden a actividades gravadas.",
		priority: "BEFORE_DECLARATION",
		riskReductionEstimate: 20,
		canAutoFix: false,
	},
	"IGV-002": {
		action:
			"Excluir facturas de proveedores NO HABIDO de la declaración de crédito fiscal.",
		priority: "IMMEDIATE",
		riskReductionEstimate: 35,
		canAutoFix: true,
		autoFixAction: "EXCLUDE_NO_HABIDO",
	},
	"RENTA-001": {
		action:
			"Preparar sustento documentario de gastos de representación (fotos, invitaciones, etc.).",
		priority: "BEFORE_DECLARATION",
		riskReductionEstimate: 10,
		canAutoFix: false,
	},
	"RENTA-002": {
		action: "Bancarizar los pagos pendientes antes del cierre del período.",
		priority: "IMMEDIATE",
		riskReductionEstimate: 25,
		canAutoFix: false,
	},
	"INV-001": {
		action:
			"Realizar inventario físico y conciliar diferencias. Documentar mermas si aplica.",
		priority: "IMMEDIATE",
		riskReductionEstimate: 30,
		canAutoFix: false,
	},
	"RATIO-001": {
		action:
			"Revisar costo de ventas - posible error de registro o subvaluación.",
		priority: "IMMEDIATE",
		riskReductionEstimate: 25,
		canAutoFix: false,
	},
	"RATIO-002": {
		action:
			"Evaluar reestructuración financiera. Considerar consulta con asesor tributario.",
		priority: "NEXT_PERIOD",
		riskReductionEstimate: 20,
		canAutoFix: false,
	},
	"RATIO-003": {
		action:
			"Revisar registro de costo de ventas e ingresos. Posible error material.",
		priority: "IMMEDIATE",
		riskReductionEstimate: 40,
		canAutoFix: false,
	},
	"DETR-001": {
		action:
			"Depositar detracciones pendientes en cuenta del Banco de la Nación.",
		priority: "IMMEDIATE",
		riskReductionEstimate: 35,
		canAutoFix: false,
	},
};

export const SECTOR_BENCHMARKS: Record<
	string,
	{
		name: string;
		marginBruto: number;
		creditRatio: number;
	}
> = {
	"4711": { name: "Comercio minorista", marginBruto: 25, creditRatio: 70 },
	"4719": {
		name: "Comercio minorista general",
		marginBruto: 22,
		creditRatio: 68,
	},
	"4690": { name: "Comercio mayorista", marginBruto: 18, creditRatio: 75 },
	"5610": { name: "Restaurantes", marginBruto: 40, creditRatio: 60 },
	"4321": { name: "Construcción", marginBruto: 15, creditRatio: 80 },
	"0111": { name: "Agricultura", marginBruto: 30, creditRatio: 50 },
	"6201": { name: "Desarrollo de software", marginBruto: 60, creditRatio: 40 },
	"6920": { name: "Consultoría contable", marginBruto: 50, creditRatio: 45 },
};

export function getSectorBenchmark(ciiu: string) {
	const sector = SECTOR_BENCHMARKS[ciiu];
	if (!sector) {
		return {
			name: "Sector no clasificado",
			marginBruto: 20,
			creditRatio: 70,
		};
	}
	return sector;
}
