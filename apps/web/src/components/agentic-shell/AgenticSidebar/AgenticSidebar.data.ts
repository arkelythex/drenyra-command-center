import {
	Building2,
	FileSearch,
	Inbox,
	Layers,
	ScrollText,
	Settings,
	Users,
	Wrench,
} from "lucide-react";
import type { AgenticNavItem, NavSectionConfig } from "./AgenticSidebar.types";

/**
 * Outcome-first sidebar navigation.
 *
 * Items are organized by accounting outcome, not by module.
 * Legacy module routes are accessible via /tools or command palette.
 */
export const AGENTIC_NAV_ITEMS: AgenticNavItem[] = [
	// ── COMMAND CENTER ──
	{
		id: "inbox",
		section: "command-center",
		label: "Inbox",
		description: "Critical tasks and due dates",
		to: "/inbox",
		icon: Inbox,
		badge: "!",
	},
	{
		id: "missions",
		section: "command-center",
		label: "Misiones",
		description: "Accounting mission workspace",
		to: "/cierre-mensual",
		icon: Layers,
	},
	{
		id: "client-360",
		section: "command-center",
		label: "Clientes 360",
		description: "Company and RUC scope",
		to: "/firm/clients",
		icon: Users,
	},
	{
		id: "evidence",
		section: "command-center",
		label: "Evidence",
		description: "Fiscal evidence vault",
		to: "/evidence",
		icon: FileSearch,
	},
	{
		id: "review-queue",
		section: "command-center",
		label: "Review queue",
		description: "Approvals and decisions",
		to: "/review-queue",
		icon: ScrollText,
	},

	// ── FISCAL SCOPE ──
	{
		id: "companies",
		section: "fiscal-scope",
		label: "Companies",
		description: "Customer companies",
		to: "/customers",
		icon: Building2,
	},

	// ── SYSTEM ──
	{
		id: "settings",
		section: "system",
		label: "Settings",
		description: "Workspace configuration",
		to: "/configuracion",
		icon: Settings,
	},
	{
		id: "tools",
		section: "system",
		label: "Tools",
		description: "Legacy module access",
		to: "/tools",
		icon: Wrench,
	},
];

export const AGENTIC_SECTIONS: NavSectionConfig[] = [
	{
		title: "COMMAND CENTER",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "command-center"),
	},
	{
		title: "FISCAL SCOPE",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "fiscal-scope"),
	},
	{
		title: "SYSTEM",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "system"),
	},
];
