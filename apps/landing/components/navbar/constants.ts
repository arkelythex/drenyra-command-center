/**
 * Navbar — enlaces sensibles al contexto (home /drenyra otras páginas).
 */

import { V2_NAVBAR_LINKS } from "@/lib/landing/section-registry";

import type { NavItem } from "./types";

export const HOME_NAV_ITEMS: readonly NavItem[] = [
	{ name: "Drenyra", href: "/drenyra" },
	{ name: "Precios", href: "/precios" },
] as const;

export const DRENYRA_NAV_ITEMS: readonly NavItem[] = V2_NAVBAR_LINKS.map((link) => ({
	name: link.label,
	href: link.href,
})) as readonly NavItem[];

export const DEFAULT_NAV_ITEMS: readonly NavItem[] = [
	{ name: "Drenyra", href: "/drenyra" },
	{ name: "Precios", href: "/precios" },
	{ name: "Civic", href: "/civic" },
	{ name: "Demo", href: "/demo" },
] as const;

export function getNavItems(pathname: string): readonly NavItem[] {
	if (pathname === "/") return HOME_NAV_ITEMS;
	if (pathname.startsWith("/drenyra")) return DRENYRA_NAV_ITEMS;
	return DEFAULT_NAV_ITEMS;
}

/** IDs de sección observados para scroll-spy (solo anclas en esta página; no incluye /docs). */
export const SECTION_IDS = [
	"social-proof",
	"request-access",
] as const;

export const UI_CONSTANTS = {
	dropdownDelay: 150,
	mobileMenuMaxHeight: "80vh",
	scrollThreshold: 10,
} as const;
