import {
	AlertTriangle,
	Building2,
	Database,
	FileCheck,
	type LucideIcon,
	ShieldCheck,
} from "lucide-react";
import type { ComplianceTab } from "../../hooks/useCompliance";

export interface ComplianceActionItem {
	id: string;
	title: string;
	summary: string;
	detail: string;
	metric: string;
	priority: "critical" | "warning" | "normal";
	tab: ComplianceTab;
	icon: LucideIcon;
	actionLabel: string;
	aiInsight: string;
	impact: string;
}

export interface ComplianceActivityItem {
	time: string;
	title: string;
	detail: string;
	tone: "warning" | "neutral" | "success";
}

export const TAB_CONFIG: Record<
	ComplianceTab,
	{ icon: LucideIcon; label: string; description: string }
> = {
	sire: {
		icon: Database,
		label: "Gestión SIRE",
		description: "Cruces, diferencias y aceptacion de propuesta.",
	},
	ruc: {
		icon: Building2,
		label: "Padron RUC",
		description: "Condicion fiscal y terceros observados.",
	},
	cpe: {
		icon: FileCheck,
		label: "Validez CPE",
		description: "Estados SUNAT, XML/CDR y validacion guiada.",
	},
	detracciones: {
		icon: ShieldCheck,
		label: "Detracciones",
		description: "Pendientes y seguimiento de depositos.",
	},
	risk: {
		icon: AlertTriangle,
		label: "Mapa de riesgos",
		description: "Exposicion, hallazgos y prioridades de auditoria.",
	},
};

export const COMPLIANCE_ACTIONS: readonly ComplianceActionItem[] = [
	{
		id: "ruc-blocker",
		title: "Proveedor no habido con impacto en cierre",
		summary: "Hay un tercero critico con condicion fiscal observada.",
		detail:
			"El padron RUC concentra 1 bloqueo y 3 validaciones pendientes antes de aprobar comprobantes vinculados.",
		metric: "4 terceros en revision",
		priority: "critical",
		tab: "ruc",
		icon: Building2,
		actionLabel: "Investigar RUC",
		aiInsight:
			"Drenyra recomienda resolver la condicion fiscal antes de aceptar propuestas SIRE o aprobar documentos del proveedor.",
		impact: "Evita validaciones SUNAT rechazadas y aprobaciones sin soporte.",
	},
	{
		id: "cpe-validation",
		title: "Comprobantes observados requieren decision",
		summary:
			"El validador detecto incidencias con codigo SUNAT y soporte disponible.",
		detail:
			"Hay 2 rechazos y 4 comprobantes pendientes que ya pueden revisarse con guia operativa, CDR y validacion manual.",
		metric: "6 comprobantes activos",
		priority: "warning",
		tab: "cpe",
		icon: FileCheck,
		actionLabel: "Revisar validacion",
		aiInsight:
			"La vista CPE ya prioriza codigo, incidente y acciones recomendadas. No hace falta salir del flujo para decidir.",
		impact:
			"Reduce retrabajo documental y acelera la regularizacion del periodo.",
	},
	{
		id: "sire-difference",
		title: "Diferencias SIRE listas para resolver",
		summary: "El cruce entre SUNAT y libros internos ya esta consolidado.",
		detail:
			"La propuesta demo de marzo mantiene diferencias accionables y coincidencias verificadas para aceptacion supervisada.",
		metric: "148 matches · 0 discrepancias demo",
		priority: "normal",
		tab: "sire",
		icon: Database,
		actionLabel: "Abrir cruce SIRE",
		aiInsight:
			"La propuesta puede aceptarse rapido, pero conviene cerrar antes el bloqueo RUC y los CPE con incidente.",
		impact: "Deja el periodo listo para export y trazabilidad.",
	},
];

export const COMPLIANCE_ACTIVITY: readonly ComplianceActivityItem[] = [
	{
		time: "09:18",
		title: "Crawler SUNAT completo padron RUC",
		detail:
			"Se detecto 1 proveedor no habido y 2 terceros con score de riesgo bajo 50.",
		tone: "warning",
	},
	{
		time: "09:42",
		title: "Validacion CPE ejecutada",
		detail:
			"Se consolidaron incidentes observados y runbooks asociados para 6 comprobantes.",
		tone: "neutral",
	},
	{
		time: "10:06",
		title: "Resumen SIRE verificado",
		detail:
			"La propuesta de marzo ya esta alineada con el dataset demo del backend.",
		tone: "success",
	},
];
