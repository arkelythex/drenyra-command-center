import type { LucideIcon } from "lucide-react";
import {
	Bell,
	Building2,
	CreditCard,
	Palette,
	Settings,
	Shield,
	ShieldCheck,
	Zap,
} from "lucide-react";

export type SettingsNavItem = {
	to: string;
	label: string;
	description: string;
	icon: LucideIcon;
};

export type SettingsNavGroup = {
	label: string;
	items: SettingsNavItem[];
};

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
	{
		label: "",
		items: [
			{
				to: "/configuracion",
				label: "General",
				description:
					"Idioma, región y configuración base del espacio de trabajo",
				icon: Settings,
			},
			{
				to: "/configuracion/integrations",
				label: "Integraciones",
				description: "OSE, SUNAT y servicios externos",
				icon: Zap,
			},
			{
				to: "/configuracion/appearance",
				label: "Apariencia",
				description: "Temas, tipografía y motor visual",
				icon: Palette,
			},
			{
				to: "/configuracion/billing",
				label: "Facturación",
				description: "Suscripción, recursos y matriz de pagos",
				icon: CreditCard,
			},
			{
				to: "/configuracion/organization",
				label: "Organización",
				description: "Identidad corporativa y equipo operativo",
				icon: Building2,
			},
			{
				to: "/configuracion/security",
				label: "Seguridad",
				description: "Autenticación, sesiones y encriptación",
				icon: Shield,
			},
			{
				to: "/configuracion/tool-permissions",
				label: "Permisos",
				description: "Políticas de aprobación por herramienta de IA",
				icon: ShieldCheck,
			},
			{
				to: "/configuracion/notifications",
				label: "Notificaciones",
				description: "Canales, prioridad y digest de señales",
				icon: Bell,
			},
		],
	},
];

export const SETTINGS_NAV: SettingsNavItem[] = SETTINGS_NAV_GROUPS.flatMap(
	(g) => g.items,
);

export function isSettingsNavItemActive(
	pathname: string,
	itemPath: string,
): boolean {
	if (itemPath === "/configuracion") {
		return pathname === "/configuracion" || pathname === "/configuracion/";
	}
	return pathname.startsWith(itemPath);
}
