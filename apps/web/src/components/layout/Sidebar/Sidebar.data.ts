import {
	Activity,
	BarChart3,
	Building2,
	CheckCircle,
	FileText,
	Gauge,
	Inbox,
	Puzzle,
	Search,
	Zap,
} from "lucide-react";
import type {
	NavItem,
	SidebarSection as SidebarSectionType,
} from "./Sidebar.types";

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
	{ icon: Puzzle, label: "Herramientas", to: "/drenyra/herramientas" },
	{ icon: Gauge, label: "Automatizaciones", to: "/drenyra/automatizaciones" },
	{ icon: Zap, label: "Skills", to: "/drenyra/skills" },
	{ icon: BarChart3, label: "Observabilidad", to: "/drenyra/observability" },
	{
		icon: Building2,
		label: "Centro de operaciones",
		to: "/drenyra/centro-de-operaciones",
	},
];

export const SIDEBAR_SECTIONS: SidebarSectionType[] = [
	{
		id: "trabajo",
		label: "TRABAJO",
		collapsible: false,
		items: [
			{ icon: Inbox, label: "Bandeja", to: "/inbox" },
			{ icon: Search, label: "Revisiones", to: "/review-queue" },
			{ icon: CheckCircle, label: "Aprobaciones", to: "/approvals" },
			{ icon: FileText, label: "Evidencia", to: "/evidence" },
		],
	},
	{
		id: "areas",
		label: "ÁREAS",
		collapsible: true,
		defaultCollapsed: false,
		items: [
			{ icon: Building2, label: "Bancos", to: "/banking" },
			{ icon: FileText, label: "Comprobantes", to: "/invoices" },
			{ icon: Activity, label: "SIRE / SUNAT", to: "/compliance" },
			{ icon: Gauge, label: "Impuestos", to: "/taxation" },
			{ icon: BarChart3, label: "Reportes", to: "/reports" },
		],
	},
	{
		id: "sistema",
		label: "SISTEMA",
		collapsible: true,
		defaultCollapsed: true,
		items: [
			{ icon: Puzzle, label: "Herramientas", to: "/drenyra/herramientas" },
			{ icon: Zap, label: "Skills", to: "/drenyra/skills" },
			{
				icon: Gauge,
				label: "Automatizaciones",
				to: "/drenyra/automatizaciones",
			},
			{
				icon: BarChart3,
				label: "Observabilidad",
				to: "/drenyra/observability",
			},
		],
	},
];

export const STATUS_STYLES: Record<string, string> = {
	open: "text-[var(--color-warning)]",
	"in-review": "text-[var(--color-primary)]",
	resolved: "text-[var(--color-success)]",
};

export const STATUS_LABELS: Record<string, string> = {
	open: "Abierto",
	"in-review": "Revisión",
	resolved: "Resuelto",
};
