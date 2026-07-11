import type { LucideIcon } from "lucide-react";
import type { AppRoutePath } from "../router/app-route";

export type NavigationSectionId =
	| "home"
	| "tablero"
	| "partes"
	| "finanzas"
	| "compliance"
	| "operaciones"
	| "agents"
	| "sistema"
	| "plugins"
	| "automations";

export type ModuleGroupId =
	| "operaciones"
	| "finanzas"
	| "compliance"
	| "sistema";

export interface NavigationItem {
	id: string;
	section: NavigationSectionId;
	label: string;
	description: string;
	to: AppRoutePath;
	icon: LucideIcon;
	keywords: readonly string[];
	activeMatch?: "exact" | "prefix";
	showInSidebar?: boolean;
	showInCommandPalette?: boolean;
	moduleGroup?: ModuleGroupId;
}

export interface NavigationGroup {
	id: NavigationSectionId;
	title: string;
	items: readonly NavigationItem[];
}

export interface MobileNavigationItem {
	icon: LucideIcon;
	label: string;
	href: AppRoutePath;
	isPrimary?: boolean;
}

export const GROUP_METADATA: Readonly<
	Record<NavigationSectionId, { title: string }>
> = {
	home: { title: "Inicio" },
	tablero: { title: "Tablero" },
	partes: { title: "Partes" },
	finanzas: { title: "Finanzas" },
	compliance: { title: "Compliance" },
	operaciones: { title: "Operaciones" },
	agents: { title: "Agentes" },
	sistema: { title: "Sistema" },
	plugins: { title: "Plugins" },
	automations: { title: "Automatizaciones" },
};

export const SIDEBAR_GROUP_ORDER: readonly NavigationSectionId[] = [
	"home",
	"tablero",
	"partes",
	"finanzas",
	"compliance",
	"operaciones",
	"agents",
	"sistema",
	"plugins",
	"automations",
];
