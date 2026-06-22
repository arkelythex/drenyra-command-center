import { Gauge, Zap, Puzzle, BarChart3 } from "lucide-react";
import type { NavItem } from "./Sidebar.types";

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
	{ icon: Puzzle, label: "Herramientas", to: "/drenyra/herramientas" },
	{ icon: Gauge, label: "Automatizaciones", to: "/drenyra/automatizaciones" },
	{ icon: Zap, label: "Skills", to: "/drenyra/skills" },
	{ icon: BarChart3, label: "Observabilidad", to: "/drenyra/observability" },
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
