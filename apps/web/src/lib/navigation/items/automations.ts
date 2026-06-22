import { CheckCircle2, Clock3 } from "lucide-react";
import type { NavigationItem } from "../types";

export const AUTOMATIONS_ITEMS: readonly NavigationItem[] = [
	{
		id: "automations-dashboard",
		section: "automations",
		label: "Gestor de rutinas",
		description: "Automatizaciones programadas y workflows",
		to: "/configuracion/automations",
		icon: Clock3,
		keywords: ["automations", "rutinas", "workflows", "tareas"],
		showInSidebar: true,
	},
	{
		id: "cierre-mensual",
		section: "automations",
		label: "Cierre Mensual",
		description: "Checklist asistido con evidencia",
		to: "/contabilidad/cierre-mensual",
		icon: CheckCircle2,
		keywords: ["cierre", "mensual", "checklist", "firma"],
		showInSidebar: true,
	},
];
