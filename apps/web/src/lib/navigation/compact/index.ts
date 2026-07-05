/**
 * @fileoverview Navegación compacta - Modo Chat-First
 * @module lib/navigation/compact
 *
 * Este módulo define una navegación simplificada con solo 3 items principales:
 * - Agents Drenyra (chat principal)
 * - Dashboard (resumen visual)
 * - Configuración (ajustes)
 *
 * Todas las demás secciones se acceden vía comandos en el chat.
 */

import {
	BrainCircuit,
	LayoutDashboard,
	type LucideIcon,
	Settings,
} from "lucide-react";

export interface CompactNavItem {
	id: string;
	label: string;
	to: string;
	icon: LucideIcon;
	description: string;
	badge?: string;
}

/**
 * Items de navegación para modo compacto (Chat-First)
 *
 * Uso:
 * ```tsx
 * import { COMPACT_NAV_ITEMS } from '@/lib/navigation/compact';
 *
 * {COMPACT_NAV_ITEMS.map(item => (
 *   <NavItem key={item.id} {...item} />
 * ))}
 * ```
 */
export const COMPACT_NAV_ITEMS: readonly CompactNavItem[] = [
	{
		id: "agents",
		label: "Agents Drenyra",
		to: "/chat",
		icon: BrainCircuit,
		description: "Chat principal con inteligencia artificial",
		badge: "AI",
	},
	{
		id: "dashboard",
		label: "Dashboard",
		to: "/dashboard",
		icon: LayoutDashboard,
		description: "Resumen ejecutivo y métricas",
	},
	{
		id: "settings",
		label: "Configuración",
		to: "/configuracion",
		icon: Settings,
		description: "Ajustes y preferencias",
	},
] as const;

/**
 * Verifica si la navegación compacta está habilitada
 * Lee de localStorage para persistir preferencia del usuario
 */
export function isCompactModeEnabled(): boolean {
	if (typeof window === "undefined") return false;
	const storedValue = localStorage.getItem("drenyra:compact-nav");
	if (storedValue === null) return true;
	return storedValue === "true";
}

/**
 * Activa/desactiva el modo de navegación compacta
 */
export function toggleCompactMode(enabled: boolean): void {
	if (typeof window === "undefined") return;
	localStorage.setItem("drenyra:compact-nav", String(enabled));
	// Disparar evento para que otros componentes se actualicen
	window.dispatchEvent(
		new CustomEvent("drenyra:nav-mode-change", {
			detail: { compact: enabled },
		}),
	);
}

export default COMPACT_NAV_ITEMS;
