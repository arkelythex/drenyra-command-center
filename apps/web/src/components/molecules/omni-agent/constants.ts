import { ArrowRightLeft, Plus, Search, Sparkles, Users2 } from "lucide-react";
import type React from "react";
import {
	COMMAND_PALETTE_ITEMS,
	type NavigationSectionId,
} from "@/lib/navigation";

export interface CommandItem {
	icon: React.ElementType;
	label: string;
	category: string;
	path?: string;
	shortcut?: string;
	keywords?: string[];
}

export const PLACEHOLDERS = [
	"Pregunta a OmniAgent...",
	"Escribe '/' para navegar...",
	"Usa '+' para acciones...",
	"Prueba 'Ir a Impuestos'...",
	"Prueba 'Nuevo Cliente'...",
];

export const GHOST_SUGGESTIONS = [
	"sire de este mes",
	"saldos de cuentas del periodo actual",
	"resumen de bancos y tesoreria",
	"lote de pagos para proveedores",
	"conciliacion bancaria de hoy",
];

const CATEGORY_LABELS: Record<NavigationSectionId, string> = {
	home: "Inicio",
	finanzas: "Finanzas",
	compliance: "Compliance",
	operaciones: "Operaciones",
	agents: "Agentes",
	sistema: "Sistema",
	plugins: "Plugins",
	automations: "Automatizaciones",
};

export const NAVIGATION_COMMANDS: CommandItem[] = COMMAND_PALETTE_ITEMS.map(
	(item) => ({
		icon: item.icon,
		label: item.label,
		category: CATEGORY_LABELS[item.section],
		path: item.to,
		keywords: [...item.keywords],
	}),
);

export const QUICK_ACTIONS: CommandItem[] = [
	{
		icon: Plus,
		label: "Nueva Factura",
		category: "Acción",
		shortcut: "N",
		keywords: ["crear", "emitir", "factura"],
	},
	{
		icon: Users2,
		label: "Registrar Cliente",
		category: "Acción",
		shortcut: "C",
		keywords: ["nuevo", "cliente"],
	},
	{
		icon: ArrowRightLeft,
		label: "Conciliación Rápida",
		category: "IA",
		shortcut: "R",
		keywords: ["conciliar", "rapido"],
	},
	{
		icon: Sparkles,
		label: "Generar Reporte Mensual",
		category: "IA",
		shortcut: "G",
		keywords: ["reporte", "generar"],
	},
	{
		icon: Search,
		label: "Búsqueda Profunda",
		category: "Herramientas",
		shortcut: "F",
		keywords: ["buscar", "deep"],
	},
];
