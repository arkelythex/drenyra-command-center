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
import type { AgenticNavItem, NavSectionConfig } from "./AgenticSidebar.types";

export const AGENTIC_NAV_ITEMS: AgenticNavItem[] = [
	// ── TABLERO ──
	{
		id: "ledger",
		section: "tablero",
		label: "Ledger",
		description: "Libro mayor contable",
		to: "/ledger",
		icon: BookOpen,
	},
	{
		id: "compliance",
		section: "tablero",
		label: "Compliance",
		description: "Cumplimiento fiscal",
		to: "/compliance",
		icon: Shield,
	},
	{
		id: "aprobaciones",
		section: "tablero",
		label: "Aprobaciones",
		description: "Aprobaciones pendientes",
		to: "/cumplimiento/approvals",
		icon: CheckSquare,
	},
	{
		id: "evidence-vault",
		section: "tablero",
		label: "Evidencia",
		description: "Vault de evidencia",
		to: "/evidence",
		icon: FileSearch,
	},

	// ── PARTES ──
	{
		id: "clients",
		section: "partes",
		label: "Clientes",
		description: "Gestión de firmas",
		to: "/customers",
		icon: Users,
	},
	{
		id: "proveedores",
		section: "partes",
		label: "Proveedores",
		description: "Gestión de proveedores",
		to: "/vendors",
		icon: Building2,
	},

	// ── SISTEMA ──
	{
		id: "settings",
		section: "sistema",
		label: "Configuración",
		description: "Configuración",
		to: "/configuracion",
		icon: Settings,
	},
	{
		id: "control-tower",
		section: "sistema",
		label: "Control Tower",
		description: "Administración del sistema",
		to: "/drenyra/control-tower",
		icon: LayoutDashboard,
	},
];

export const AGENTIC_SECTIONS: NavSectionConfig[] = [
	{
		title: "TABLERO",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "tablero"),
	},
	{
		title: "PARTES",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "partes"),
	},
	{
		title: "SISTEMA",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "sistema"),
	},
];
