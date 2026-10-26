import type { LucideIcon } from "lucide-react";
import {
	Bell,
	Building2,
	CreditCard,
	Palette,
	Settings,
	Shield,
	ShieldCheck,
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
				to: "/settings",
				label: "General",
				description:
					"Idioma, región y configuración base del espacio de trabajo",
				icon: Settings,
			},
			{
				to: "/settings/appearance",
				label: "Apariencia",
				description: "Temas, tipografía y motor visual",
				icon: Palette,
			},
			{
				to: "/settings/billing",
				label: "Facturación",
				description: "Suscripción, recursos y matriz de pagos",
				icon: CreditCard,
			},
			{
				to: "/settings/organization",
				label: "Organización",
				description: "Identidad corporativa y equipo operativo",
				icon: Building2,
			},
			{
				to: "/settings/security",
				label: "Seguridad",
				description: "Autenticación, sesiones y encriptación",
				icon: Shield,
			},
			{
				to: "/settings/tool-permissions",
				label: "Permisos",
				description: "Políticas de aprobación por herramienta de IA",
				icon: ShieldCheck,
			},
			{
				to: "/settings/notifications",
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
	if (itemPath === "/settings") {
		return pathname === "/settings" || pathname === "/settings/";
	}
	return pathname.startsWith(itemPath);
}
