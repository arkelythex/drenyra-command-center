/**
 * Enlaces del ecosistema Arkelythex — fuente única para footer y rails en páginas internas.
 * La home usa `BRAND_HOME_COPY` (visual); esto cubre descubrimiento en rutas de producto.
 */

export type EcosystemNavLink = {
	readonly name: string;
	readonly href: string;
	/** Módulo en roadmap público (Gov, Grid). */
	readonly roadmap?: boolean;
};

export const ECOSYSTEM_NAV_LINKS: readonly EcosystemNavLink[] = [
	{ name: "Drenyra", href: "/drenyra" },
	{ name: "Precios", href: "/drenyra#drenyra-pricing" },
	{ name: "Seguridad", href: "/seguridad" },
	{ name: "API Docs", href: "/api" },
	{ name: "Civic", href: "/civic" },
	{ name: "Gov", href: "/gov", roadmap: true },
	{ name: "Grid", href: "/grid", roadmap: true },
] as const;
