import {
	PlusCircle,
	ClipboardCheck,
	Cpu,
	Timer,
	Puzzle,
	FileSearch,
	Settings,
	Upload,
	Download,
	FileText,
	Search,
} from "lucide-react";
import type { PaletteCommand, CommandCategory } from "./CommandPalette.types";

export const COMMAND_PALETTE_COMMANDS: PaletteCommand[] = [
	// ─── NAVIGATION ───
	{
		id: "nav-new-thread",
		label: "New Thread",
		description: "Crear un nuevo thread contable",
		icon: PlusCircle,
		category: "navigation",
		shortcut: "⌘N",
		action: () => {
			window.location.href = "/threads/new";
		},
		keywords: ["thread", "nuevo", "crear"],
	},
	{
		id: "nav-review-queue",
		label: "Review Queue",
		description: "Cola de aprobación de cambios pendientes",
		icon: ClipboardCheck,
		category: "navigation",
		shortcut: "⌘R",
		action: () => {
			window.location.href = "/review";
		},
		keywords: ["review", "aprobacion", "cola", "pendientes"],
	},
	{
		id: "nav-agents",
		label: "Agents",
		description: "Ventana de agentes trabajando en paralelo",
		icon: Cpu,
		category: "navigation",
		action: () => {
			window.location.href = "/agents";
		},
		keywords: ["agentes", "agentes", "paralelo"],
	},
	{
		id: "nav-automations",
		label: "Automations",
		description: "Rutinas automáticas programadas",
		icon: Timer,
		category: "navigation",
		action: () => {
			window.location.href = "/automations";
		},
		keywords: ["automations", "rutinas", "automatico"],
	},
	{
		id: "nav-skills",
		label: "Skills",
		description: "Librería de skills contables",
		icon: Puzzle,
		category: "navigation",
		action: () => {
			window.location.href = "/skills";
		},
		keywords: ["skills", "plugins"],
	},
	{
		id: "nav-evidence",
		label: "Evidence Vault",
		description: "Vault de evidencia documental",
		icon: FileSearch,
		category: "navigation",
		action: () => {
			window.location.href = "/evidence";
		},
		keywords: ["evidence", "vault", "documentos"],
	},
	{
		id: "nav-settings",
		label: "Settings",
		description: "Configuración general",
		icon: Settings,
		category: "navigation",
		shortcut: "⌘,",
		action: () => {
			window.location.href = "/settings";
		},
		keywords: ["settings", "configuracion"],
	},

	// ─── ACTIONS ───
	{
		id: "action-upload",
		label: "Subir factura",
		description: "Subir una factura electrónica o física",
		icon: Upload,
		category: "action",
		action: () => {},
		keywords: ["upload", "subir", "factura", "xml"],
	},
	{
		id: "action-import",
		label: "Importar extracto bancario",
		description: "Importar movimientos bancarios",
		icon: Download,
		category: "action",
		action: () => {},
		keywords: ["import", "banco", "extracto"],
	},
	{
		id: "action-report",
		label: "Exportar reporte",
		description: "Exportar reporte del periodo activo",
		icon: FileText,
		category: "action",
		action: () => {},
		keywords: ["export", "reporte", "pdf", "excel"],
	},

	// ─── AGENTS ───
	{
		id: "agent-sire",
		label: "SIRE Agent — Andrés Capital SAC",
		description: "Validar SIRE compras del periodo activo",
		icon: Search,
		category: "agent",
		action: () => {},
		keywords: ["sire", "agente", "compras", "validar"],
	},
	{
		id: "agent-reconcile",
		label: "Reconciliation Agent — Nova SAC",
		description: "Conciliar movimientos bancarios",
		icon: Search,
		category: "agent",
		action: () => {},
		keywords: ["reconcile", "conciliar", "banco"],
	},
	{
		id: "agent-risk",
		label: "Tax Risk Agent — Luna EIRL",
		description: "Revisar riesgos fiscales",
		icon: Search,
		category: "agent",
		action: () => {},
		keywords: ["risk", "riesgo", "fiscal", "auditoria"],
	},
];

export const CATEGORY_CONFIG: Record<
	CommandCategory,
	{ label: string; order: number }
> = {
	recent: { label: "Recientes", order: 0 },
	navigation: { label: "Navegación", order: 1 },
	action: { label: "Acciones", order: 2 },
	agent: { label: "Agentes", order: 3 },
};
