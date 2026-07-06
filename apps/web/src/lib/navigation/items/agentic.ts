import {
	Bot,
	FileSearch,
	ListChecks,
	Plug,
	Settings,
	Users,
	Wrench,
	Zap,
} from "lucide-react";
import type { NavigationItem } from "../types";

/**
 * Agentic-first navigation items for the new Drenyra shell.
 *
 * 3 sections:
 *   - workspace: New Thread, Review Queue, Agents
 *   - platform: Automations, Skills, Evidence Vault
 *   - organization: Clients, Settings
 */
export const AGENTIC_NAV_ITEMS: readonly NavigationItem[] = [
	// ── WORKSPACE ──────────────────────────────────────────────
	{
		id: "new-thread",
		section: "agents",
		label: "New Thread",
		description: "Iniciar una nueva sesión de trabajo con agentes",
		to: "/drenyra",
		icon: Zap,
		keywords: ["thread", "nuevo", "sesión", "agentes", "work"],
	},
	{
		id: "review-queue",
		section: "agents",
		label: "Review Queue",
		description: "Cola de aprobación de cambios propuestos por agentes",
		to: "/review",
		icon: ListChecks,
		keywords: [
			"review",
			"queue",
			"cola",
			"aprobación",
			"revisión",
			"pendientes",
		],
	},
	{
		id: "agents",
		section: "agents",
		label: "Agents",
		description: "Sesiones activas de agentes trabajando en paralelo",
		to: "/agents",
		icon: Bot,
		keywords: ["agents", "agentes", "sesiones", "paralelo", "trabajo"],
	},

	// ── PLATFORM ───────────────────────────────────────────────
	{
		id: "automations",
		section: "automations",
		label: "Automations",
		description: "Rutinas automáticas que ejecutan skills en background",
		to: "/automations",
		icon: Wrench,
		keywords: [
			"automations",
			"automatizaciones",
			"rutinas",
			"background",
			"schedule",
		],
	},
	{
		id: "skills",
		section: "automations",
		label: "Skills",
		description: "Librería de skills contables instalables",
		to: "/skills",
		icon: Plug,
		keywords: ["skills", "capacidades", "plugins", "contables", "instalar"],
	},
	{
		id: "evidence-vault",
		section: "automations",
		label: "Evidence Vault",
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

	// ── ORGANIZATION ───────────────────────────────────────────
	{
		id: "clients",
		section: "sistema",
		label: "Clientes",
		description: "Gestión de firmas y clientes",
		to: "/drenyra/control-tower",
		icon: Users,
		keywords: ["clientes", "firmas", "client", "empresas", "ruc"],
		showInSidebar: true,
	},
	{
		id: "settings",
		section: "sistema",
		label: "Settings",
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
];

/** Order of sections as they appear in the sidebar. */
export const AGENTIC_SECTION_ORDER = [
	"agents",
	"automations",
	"sistema",
] as const;

/** Section display labels and icons. */
export const AGENTIC_SECTION_CONFIG: Record<
	string,
	{ title: string; icon?: string }
> = {
	agents: { title: "WORKSPACE" },
	automations: { title: "PLATFORM" },
	sistema: { title: "ORGANIZATION" },
};
