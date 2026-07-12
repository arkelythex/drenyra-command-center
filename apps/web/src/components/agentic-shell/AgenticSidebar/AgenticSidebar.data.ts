import {
	Banknote,
	FileCheck,
	FileSearch,
	FileText,
	Gavel,
	Inbox,
	Landmark,
	Receipt,
	ScrollText,
	Settings,
} from "lucide-react";
import type { AgenticNavItem, NavSectionConfig } from "./AgenticSidebar.types";

/**
 * Restructured sidebar navigation — workspace-oriented, not module-oriented.
 *
 * Sections:
 *   TRABAJO    — daily operational tasks & agentic workflows
 *   ÁREAS      — domain tools (banking, invoices, tax, SUNAT, reports)
 *   SISTEMA    — audit trail and configuration
 *
 * Removed from first level:
 *   - Misiones → renamed to Revisiones in TRABAJO
 *   - Empresas → moved to bottom switcher
 *   - Conciliaciones → accessible via /tesoreria pattern
 *   - Ledger → accessible from context
 *   - Cumplimiento → overlaps with SIRE + Impuestos + Auditoría
 *   - Estados Financieros → Reportes covers it
 *   - Herramientas → moved to command palette
 */

export const AGENTIC_NAV_ITEMS: AgenticNavItem[] = [
	// ── TRABAJO ──
	{
		id: "inbox",
		section: "trabajo",
		label: "Bandeja",
		description: "Tareas críticas y fechas límite",
		to: "/inbox",
		icon: Inbox,
		badge: "!",
	},
	{
		id: "revisions",
		section: "trabajo",
		label: "Revisiones",
		description: "Cierres, conciliaciones y revisiones activas",
		to: "/cierre-mensual",
		icon: ScrollText,
	},
	{
		id: "approval-queue",
		section: "trabajo",
		label: "Aprobaciones",
		description: "Pendientes de revisión y firma",
		to: "/review-queue",
		icon: FileSearch,
		badge: "2",
	},
	{
		id: "evidence",
		section: "trabajo",
		label: "Evidencia",
		description: "Bóveda de evidencia fiscal",
		to: "/evidence",
		icon: FileText,
	},

	// ── ÁREAS ──
	{
		id: "banking",
		section: "areas",
		label: "Bancos",
		description: "Gestión de bancos y tesorería",
		to: "/banking",
		icon: Landmark,
	},
	{
		id: "invoices",
		section: "areas",
		label: "Comprobantes",
		description: "Facturas, notas de crédito y débito",
		to: "/invoices",
		icon: Receipt,
	},
	{
		id: "sire",
		section: "areas",
		label: "SIRE / SUNAT",
		description: "Registros electrónicos SUNAT y SIRE",
		to: "/cumplimiento/expedientes",
		icon: FileCheck,
	},
	{
		id: "taxation",
		section: "areas",
		label: "Impuestos",
		description: "IGV, renta y gestión tributaria",
		to: "/taxation",
		icon: Banknote,
	},
	{
		id: "reports",
		section: "areas",
		label: "Reportes",
		description: "Reportes y exportaciones",
		to: "/reports",
		icon: FileText,
	},

	// ── SISTEMA ──
	{
		id: "audit",
		section: "system",
		label: "Auditoría",
		description: "Trazabilidad y registros de auditoría",
		to: "/audit",
		icon: Gavel,
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
		title: "TRABAJO",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "trabajo"),
	},
	{
		title: "ÁREAS",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "areas"),
	},
	{
		title: "SISTEMA",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "system"),
	},
];
