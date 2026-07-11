import {
	Banknote,
	BarChart3,
	FileCheck,
	FileSearch,
	FileSpreadsheet,
	FileText,
	Gavel,
	Inbox,
	Landmark,
	Layers,
	Receipt,
	ScrollText,
	Search,
	Settings,
	Shield,
	Users,
	Wrench,
} from "lucide-react";
import type { AgenticNavItem, NavSectionConfig } from "./AgenticSidebar.types";

/**
 * Outcome-first sidebar navigation.
 *
 * Sections:
 *   COMMAND CENTER   — daily operations & agentic workflows
 *   OPERACIONES      — accounting operations (banking, reconciliations, ledgers)
 *   FISCAL & COMPLIANCE — tax, SUNAT, SIRE, detracciones
 *   REPORTES         — financial statements, reports, audit
 *   SYSTEM           — settings, legacy tools
 */
export const AGENTIC_NAV_ITEMS: AgenticNavItem[] = [
	// ── COMMAND CENTER ──
	{
		id: "inbox",
		section: "command-center",
		label: "Bandeja",
		description: "Tareas críticas y fechas límite",
		to: "/inbox",
		icon: Inbox,
		badge: "!",
	},
	{
		id: "missions",
		section: "command-center",
		label: "Misiones",
		description: "Espacio de trabajo del cierre contable",
		to: "/cierre-mensual",
		icon: Layers,
	},
	{
		id: "client-360",
		section: "command-center",
		label: "Empresas",
		description: "Empresas y alcance por RUC",
		to: "/firm/clients",
		icon: Users,
	},
	{
		id: "evidence",
		section: "command-center",
		label: "Evidencia",
		description: "Bóveda de evidencia fiscal",
		to: "/evidence",
		icon: FileSearch,
	},
	{
		id: "review-queue",
		section: "command-center",
		label: "Cola de revisión",
		description: "Aprobaciones y decisiones",
		to: "/review-queue",
		icon: ScrollText,
	},

	// ── OPERACIONES ──
	{
		id: "banking",
		section: "operaciones",
		label: "Bancos",
		description: "Gestión de bancos y tesorería",
		to: "/banking",
		icon: Landmark,
	},
	{
		id: "reconciliations",
		section: "operaciones",
		label: "Conciliaciones",
		description: "Conciliaciones bancarias",
		to: "/tesoreria/reconciliations",
		icon: Search,
	},
	{
		id: "invoices",
		section: "operaciones",
		label: "Comprobantes",
		description: "Facturas, notas de crédito y débito",
		to: "/invoices",
		icon: Receipt,
	},
	{
		id: "ledger",
		section: "operaciones",
		label: "Libro Mayor",
		description: "Asientos y saldos por cuenta",
		to: "/contabilidad/ledger",
		icon: FileSpreadsheet,
	},

	// ── FISCAL & COMPLIANCE ──
	{
		id: "taxation",
		section: "fiscal-compliance",
		label: "Impuestos",
		description: "IGV, renta y gestión tributaria",
		to: "/taxation",
		icon: Banknote,
	},
	{
		id: "sire",
		section: "fiscal-compliance",
		label: "SIRE / SUNAT",
		description: "Registros electrónicos SUNAT y SIRE",
		to: "/cumplimiento/expedientes",
		icon: FileCheck,
	},
	{
		id: "compliance",
		section: "fiscal-compliance",
		label: "Cumplimiento",
		description: "Cumplimiento y validaciones fiscales",
		to: "/compliance",
		icon: Shield,
	},

	// ── REPORTES ──
	{
		id: "financials",
		section: "reportes",
		label: "Estados Financieros",
		description: "Balance general y resultados",
		to: "/financials",
		icon: BarChart3,
	},
	{
		id: "reports",
		section: "reportes",
		label: "Reportes",
		description: "Reportes y exportaciones",
		to: "/reports",
		icon: FileText,
	},
	{
		id: "audit",
		section: "reportes",
		label: "Auditoría",
		description: "Trazabilidad y registros de auditoría",
		to: "/audit",
		icon: Gavel,
	},

	// ── SYSTEM ──
	{
		id: "tools",
		section: "system",
		label: "Herramientas",
		description: "Herramientas operativas",
		to: "/tools",
		icon: Wrench,
	},
	{
		id: "settings",
		section: "system",
		label: "Configuración",
		description: "Configuración del espacio de trabajo",
		to: "/configuracion",
		icon: Settings,
	},
];

export const AGENTIC_SECTIONS: NavSectionConfig[] = [
	{
		title: "CENTRO DE OPERACIONES",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "command-center"),
	},
	{
		title: "OPERACIONES",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "operaciones"),
	},
	{
		title: "FISCAL Y CUMPLIMIENTO",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "fiscal-compliance"),
	},
	{
		title: "REPORTES",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "reportes"),
	},
	{
		title: "SISTEMA",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "system"),
	},
];
