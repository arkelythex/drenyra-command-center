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
		section: "work",
		label: "Fiscal ledger",
		description: "Accounting workbench",
		to: "/ledger",
		icon: BookOpen,
	},
	{
		id: "compliance",
		section: "work",
		label: "Compliance review",
		description: "SUNAT and fiscal checks",
		to: "/compliance",
		icon: Shield,
	},
	{
		id: "aprobaciones",
		section: "work",
		label: "Pending approvals",
		description: "Human decisions required",
		to: "/cumplimiento/approvals",
		icon: CheckSquare,
	},
	{
		id: "evidence-vault",
		section: "work",
		label: "Evidence",
		description: "Fiscal evidence vault",
		to: "/evidence",
		icon: FileSearch,
	},

	// ── PARTES ──
	{
		id: "clients",
		section: "parties",
		label: "Companies",
		description: "Company and RUC scope",
		to: "/customers",
		icon: Users,
	},
	{
		id: "proveedores",
		section: "parties",
		label: "Counterparties",
		description: "Vendors and related parties",
		to: "/vendors",
		icon: Building2,
	},

	// ── SISTEMA ──
	{
		id: "settings",
		section: "system",
		label: "Settings",
		description: "Workspace configuration",
		to: "/configuracion",
		icon: Settings,
	},
	{
		id: "control-tower",
		section: "system",
		label: "Control Tower",
		description: "System administration",
		to: "/drenyra/control-tower",
		icon: LayoutDashboard,
	},
];

export const AGENTIC_SECTIONS: NavSectionConfig[] = [
	{
		title: "ACTIVE WORK",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "work"),
	},
	{
		title: "FISCAL SCOPE",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "parties"),
	},
	{
		title: "SISTEMA",
		items: AGENTIC_NAV_ITEMS.filter((i) => i.section === "system"),
	},
];
