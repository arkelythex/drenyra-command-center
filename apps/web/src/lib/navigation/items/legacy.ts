import { BarChart3, Building2, Gauge, Puzzle, Zap } from "lucide-react";
import type { NavigationItem } from "@/lib/navigation/types";

/**
 * Legacy sidebar nav items — preserved for command palette access.
 * All marked with showInSidebar: false after the agentic transformation.
 */
export const LEGACY_NAV_ITEMS: NavigationItem[] = [
	{
		id: "herramientas",
		section: "plugins",
		label: "Herramientas",
		description: "Herramientas contables",
		to: "/drenyra/herramientas" as never,
		icon: Puzzle,
		keywords: ["herramientas", "tools"],
		showInSidebar: false,
		showInCommandPalette: true,
	},
	{
		id: "automatizaciones",
		section: "automations",
		label: "Automatizaciones",
		description: "Automatizaciones programadas",
		to: "/drenyra/automatizaciones" as never,
		icon: Gauge,
		keywords: ["automatizaciones", "automations"],
		showInSidebar: false,
		showInCommandPalette: true,
	},
	{
		id: "skills",
		section: "plugins",
		label: "Skills",
		description: "Librería de skills contables",
		to: "/drenyra/skills" as never,
		icon: Zap,
		keywords: ["skills", "plugins"],
		showInSidebar: false,
		showInCommandPalette: true,
	},
	{
		id: "observability",
		section: "sistema",
		label: "Observabilidad",
		description: "Monitoreo del sistema",
		to: "/drenyra/observability" as never,
		icon: BarChart3,
		keywords: ["observability", "monitoreo"],
		showInSidebar: false,
		showInCommandPalette: true,
	},
	{
		id: "control-tower",
		section: "home",
		label: "Control Tower",
		description: "Panel de control de firmas",
		to: "/drenyra/control-tower" as never,
		icon: Building2,
		keywords: ["control", "firmas", "dashboard"],
		showInSidebar: false,
		showInCommandPalette: true,
	},
];
