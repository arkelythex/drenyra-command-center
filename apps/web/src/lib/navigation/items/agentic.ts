import {
	BookOpen,
	Building2,
	CheckSquare,
	FileSearch,
	LayoutDashboard,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import type { NavigationItem } from "../types";

/**
 * Agentic-first navigation items for the new Drenyra shell.
 *
 * 3 sections:
 *   - tablero: Ledger, Compliance, Aprobaciones, Evidencia
 *   - partes: Clientes, Proveedores
 *   - sistema: Configuración, Control Tower
 */
export const AGENTIC_NAV_ITEMS: readonly NavigationItem[] = [
	// ── TABLERO ────────────────────────────────────────────────
	{
		id: "ledger",
		section: "tablero",
		label: "Ledger",
		description: "Libro mayor contable",
		to: "/ledger",
		icon: BookOpen,
		keywords: ["ledger", "libro mayor", "contabilidad"],
	},
	{
		id: "compliance",
		section: "tablero",
		label: "Compliance",
		description: "Cumplimiento fiscal",
		to: "/compliance",
		icon: Shield,
		keywords: ["compliance", "cumplimiento", "fiscal"],
	},
	{
		id: "aprobaciones",
		section: "tablero",
		label: "Aprobaciones",
		description: "Aprobaciones pendientes",
		to: "/cumplimiento/approvals",
		icon: CheckSquare,
		keywords: ["aprobaciones", "approvals", "revision"],
	},
	{
		id: "evidence-vault",
		section: "tablero",
		label: "Evidencia",
		description: "Vault de evidencia con linaje probatorio completo",
		to: "/evidence",
		icon: FileSearch,
		keywords: [
			"evidence",
			"evidencia",
			"vault",
			"documentos",
			"xml",
			"cdr",
			"pdf",
		],
	},

	// ── PARTES ─────────────────────────────────────────────────
	{
		id: "clients",
		section: "partes",
		label: "Clientes",
		description: "Gestión de firmas y clientes",
		to: "/customers",
		icon: Users,
		keywords: ["clientes", "firmas", "client", "empresas", "ruc"],
	},
	{
		id: "proveedores",
		section: "partes",
		label: "Proveedores",
		description: "Gestión de proveedores",
		to: "/vendors",
		icon: Building2,
		keywords: ["proveedores", "vendors", "proveedor"],
	},

	// ── SISTEMA ────────────────────────────────────────────────
	{
		id: "settings",
		section: "sistema",
		label: "Configuración",
		description: "Configuración general del sistema",
		to: "/configuracion",
		icon: Settings,
		keywords: [
			"settings",
			"configuración",
			"preferencias",
			"ajustes",
			"perfil",
		],
	},
	{
		id: "control-tower",
		section: "sistema",
		label: "Control Tower",
		description: "Administración del sistema",
		to: "/drenyra/control-tower",
		icon: LayoutDashboard,
		keywords: ["control tower", "torre de control", "admin"],
	},
];

/** Order of sections as they appear in the sidebar. */
export const AGENTIC_SECTION_ORDER = ["tablero", "partes", "sistema"] as const;

/** Section display labels and icons. */
export const AGENTIC_SECTION_CONFIG: Record<
	string,
	{ title: string; icon?: string }
> = {
	tablero: { title: "TABLERO" },
	partes: { title: "PARTES" },
	sistema: { title: "SISTEMA" },
};
