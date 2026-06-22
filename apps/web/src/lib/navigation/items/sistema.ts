import { Activity, Boxes, Cog, Settings, Zap } from "lucide-react";
import type { NavigationItem } from "../types";

export const SISTEMA_ITEMS: readonly NavigationItem[] = [
	{
		id: "compare",
		section: "sistema",
		label: "Escenarios financieros",
		description: "Comparar escenarios y prestamos",
		to: "/configuracion/compare",
		icon: Activity,
		keywords: ["simulador", "comparar", "prestamos"],
	},
	{
		id: "connections",
		section: "sistema",
		label: "Integraciones",
		description: "OSE, SUNAT y servicios externos",
		to: "/configuracion/integrations" as NavigationItem["to"],
		icon: Zap,
		keywords: ["integraciones", "conexiones", "apis"],
	},
	{
		id: "product-surfaces",
		section: "sistema",
		label: "Product surfaces",
		description: "Mapa operativo entre marcas, módulos reales y docs canónicas",
		to: "/configuracion/product-surfaces",
		icon: Boxes,
		keywords: [
			"surfaces",
			"productos",
			"topologia",
			"arquitectura",
			"ownership",
			"docs",
		],
	},
	{
		id: "settings",
		section: "sistema",
		label: "Configuracion",
		description: "Empresa, seguridad y preferencias",
		to: "/configuracion",
		icon: Settings,
		keywords: ["settings", "configuracion", "ajustes"],
		showInSidebar: false,
	},
	{
		id: "profile",
		section: "sistema",
		label: "Mi cuenta",
		description: "Perfil, sesion y acceso",
		to: "/configuracion/profile",
		icon: Cog,
		keywords: ["perfil", "cuenta", "usuario"],
		showInSidebar: false,
	},
];
