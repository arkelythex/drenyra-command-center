import {
	PlusCircle,
	ClipboardCheck,
	Cpu,
	Timer,
	Puzzle,
	FileSearch,
	Building2,
	Settings,
} from "lucide-react";
import type { AgenticNavItem } from "../AgenticLayout/AgenticLayout.types";

export const AGENTIC_NAV_ITEMS: AgenticNavItem[] = [
	// ─── WORKSPACE ───
	{
		id: "new-thread",
		section: "workspace",
		label: "New Thread",
		icon: PlusCircle,
		to: "/threads/new",
	},
	{
		id: "review-queue",
		section: "workspace",
		label: "Review Queue",
		icon: ClipboardCheck,
		to: "/review",
		badge: 0,
		badgeVariant: "critical",
	},
	{
		id: "agents",
		section: "workspace",
		label: "Agents",
		icon: Cpu,
		to: "/agents",
		badge: 0,
		badgeVariant: "info",
	},

	// ─── PLATFORM ───
	{
		id: "automations",
		section: "platform",
		label: "Automations",
		icon: Timer,
		to: "/automations",
	},
	{
		id: "skills",
		section: "platform",
		label: "Skills",
		icon: Puzzle,
		to: "/skills",
	},
	{
		id: "evidence",
		section: "platform",
		label: "Evidence Vault",
		icon: FileSearch,
		to: "/evidence",
	},

	// ─── ORGANIZATION ───
	{
		id: "clients",
		section: "organization",
		label: "Clientes",
		icon: Building2,
		to: "/clients",
	},
	{
		id: "settings",
		section: "organization",
		label: "Settings",
		icon: Settings,
		to: "/settings",
	},
];

export const AGENTIC_SECTION_CONFIG: Record<
	AgenticNavItem["section"],
	{ label: string }
> = {
	workspace: { label: "Workspace" },
	platform: { label: "Platform" },
	organization: { label: "Organization" },
};
