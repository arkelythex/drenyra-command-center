import { BrainCircuit, Inbox, LayoutDashboard } from "lucide-react";
import type { NavigationItem } from "../types";

export const INTELLIGENCE_ITEMS: readonly NavigationItem[] = [
	{
		id: "dashboard",
		section: "home",
		label: "Inicio",
		description: "Overview operativo, alertas y colas prioritarias",
		to: "/dashboard",
		icon: LayoutDashboard,
		keywords: ["dashboard", "inicio", "resumen", "panel", "home"],
		activeMatch: "prefix",
	},
	{
		id: "drenyra",
		section: "agents",
		label: "Drenyra",
		description: "Workspace inteligente: threads, casos fiscales y agentes",
		to: "/drenyra",
		icon: BrainCircuit,
		keywords: [
			"drenyra",
			"ai",
			"agentes",
			"workspace",
			"threads",
			"casos",
			"chat",
			"codex",
			"comandos",
		],
	},
	{
		id: "inbox",
		section: "home",
		label: "Bandeja documental",
		description: "Documentos recibidos y por validar",
		to: "/inbox",
		icon: Inbox,
		keywords: ["inbox", "recepcion", "documentos", "entrada"],
	},
];
