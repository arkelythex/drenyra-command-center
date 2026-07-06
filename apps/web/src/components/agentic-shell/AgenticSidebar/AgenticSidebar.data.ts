import {
	Bot,
	FileSearch,
	Plug,
	Settings,
	Users,
	Wrench,
	Zap,
} from "lucide-react";
import type { AgenticNavItem, NavSectionConfig } from "./AgenticSidebar.types";

export const AGENTIC_NAV_ITEMS: AgenticNavItem[] = [
	// ── WORKSPACE ──
	{
		id: "new-thread",
		section: "agents",
		label: "New Thread",
		description: "Iniciar sesión de trabajo",
		to: "/drenyra",
		icon: Zap,
	},
	{
		id: "agents",
		section: "agents",
		label: "Agents",
		description: "Sesiones de agentes activos",
		to: "/agents",
		icon: Bot,
		badge: 2,
	},

	// ── PLATFORM ──
	{
		id: "automations",
		section: "automations",
		label: "Automations",
		description: "Rutinas automáticas",
		to: "/automations",
		icon: Wrench,
	},
	{
		id: "skills",
		section: "automations",
		label: "Skills",
		description: "Librería de skills",
		to: "/skills",
		icon: Plug,
	},
	{
		id: "evidence-vault",
		section: "automations",
		label: "Evidence Vault",
		description: "Vault de evidencia",
		to: "/evidence",
		icon: FileSearch,
	},

	// ── ORGANIZATION ──
	{
		id: "clients",
		section: "sistema",
		label: "Clientes",
		description: "Gestión de firmas",
		to: "/drenyra/control-tower",
		icon: Users,
	},
	{
		id: "settings",
		section: "sistema",
		label: "Settings",
		description: "Configuración",
		to: "/configuracion",
		icon: Settings,
	},
];

export const AGENTIC_SECTIONS: NavSectionConfig[] = [
	{
		title: "WORKSPACE",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "agents"),
	},
	{
		title: "PLATFORM",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "automations"),
	},
	{
		title: "ORGANIZATION",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "sistema"),
	},
];
