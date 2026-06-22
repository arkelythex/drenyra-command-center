/**
 * Single source of truth for /docs navigation (sidebar, command menu).
 * IA alineada a intención (Diátaxis / tareas): empezar, conceptos, referencia, recursos.
 */

import {
	getExtendedDocsSearchEntries,
	type DocsSearchEntryExtended,
} from "@/lib/data/docs-search-extended";

export type DocsNavItem = {
	label: string;
	href: string;
};

export type DocsNavGroup = {
	title: string;
	items: readonly DocsNavItem[];
};

/** Media Kit /docs/visuals — alineado a secciones reales (DocSection id) */
export const DOCS_MEDIA_KIT_GROUPS: readonly DocsNavGroup[] = [
	{
		title: "EN ESTA PÁGINA",
		items: [
			{ label: "Vista general", href: "/docs/visuals" },
			{ label: "Paleta de colores", href: "/docs/visuals#colores" },
			{ label: "Tipografía", href: "/docs/visuals#tipografia" },
			{ label: "Logos", href: "/docs/visuals#logos" },
			{ label: "Ilustración", href: "/docs/visuals#ilustraciones" },
			{ label: "Fotografía", href: "/docs/visuals#fotografia" },
			{ label: "Accesibilidad", href: "/docs/visuals#accesibilidad" },
			{ label: "Voz de marca", href: "/docs/visuals#voz-marca" },
			{ label: "Contacto", href: "/docs/visuals#contacto" },
			{ label: "Descarga (media kit)", href: "/docs/visuals#descarga" },
		],
	},
	{
		title: "RELACIONADOS",
		items: [
			{ label: "Design System (tokens)", href: "/docs/design-system#overview" },
			{ label: "API Docs", href: "/api" },
		],
	},
];

/** Sidebar cuando pathname === /docs/design-system */
export const DOCS_DESIGN_SYSTEM_GROUPS: readonly DocsNavGroup[] = [
	{
		title: "CONCEPTOS",
		items: [
			{ label: "Vista general", href: "/docs/design-system#overview" },
			{ label: "Filosofía", href: "/docs/design-system#filosofia" },
			{
				label: "Principios de interfaz",
				href: "/docs/design-system#principios",
			},
			{ label: "Voz y tono", href: "/docs/visuals#voz-marca" },
		],
	},
	{
		title: "REFERENCIA — TOKENS",
		items: [
			{ label: "Color — neutros", href: "/docs/design-system#neutrals" },
			{ label: "Color — marca", href: "/docs/design-system#brand" },
			{
				label: "Semántica (estado)",
				href: "/docs/design-system#semantic-states",
			},
			{
				label: "Aliases de producto",
				href: "/docs/design-system#semantic-colors",
			},
			{ label: "Radius", href: "/docs/design-system#radius" },
			{ label: "Tipografía", href: "/docs/design-system#fonts" },
			{ label: "Espaciado", href: "/docs/design-system#spacing" },
			{
				label: "Elevación y motion",
				href: "/docs/design-system#efectos-motion",
			},
			{ label: "Iconografía (logos)", href: "/docs/visuals#logos" },
		],
	},
	{
		title: "GUÍAS — UI",
		items: [
			{ label: "Componentes", href: "/docs/design-system#componentes" },
			{ label: "Patrones", href: "/docs/design-system#patrones" },
		],
	},
	{
		title: "RECURSOS DE MARCA",
		items: [
			{ label: "Iconos y logos", href: "/docs/visuals#logos" },
			{ label: "Ilustración", href: "/docs/visuals#ilustraciones" },
			{ label: "Fotografía", href: "/docs/visuals#fotografia" },
			{ label: "Accesibilidad", href: "/docs/visuals#accesibilidad" },
		],
	},
];

/** Resto de rutas /docs/* (Portal unificado) */
export const DOCS_PUBLIC_GROUPS: readonly DocsNavGroup[] = [
	{
		title: "EMPEZAR",
		items: [
			{ label: "API Docs", href: "/api" },
			{ label: "Design System", href: "/docs/design-system" },
			{ label: "Media Kit", href: "/docs/visuals" },
			{ label: "API", href: "/api" },
		],
	},
	{
		title: "API REFERENCE",
		items: [
			{ label: "Rutas de integración", href: "/api#build-paths" },
			{ label: "SDKs y librerías", href: "/api#sdks" },
			{ label: "Capacidades", href: "/api#capabilities" },
		],
	},
	{
		title: "CONTEXTO DE PRODUCTO",
		items: [
			{ label: "Visión", href: "/docs/vision" },
			{ label: "Roadmap", href: "/docs/roadmap" },
			{ label: "Inversores", href: "/docs/investors" },
		],
	},
	{
		title: "REFERENCIA TÉCNICA",
		items: [
			{ label: "Arquitectura", href: "/docs/architecture" },
			{ label: "Sovereign Core", href: "/docs/sovereign-core" },
			{ label: "SUNAT Compliance", href: "/docs/sunat-compliance" },
			{ label: "CBDC & Banking", href: "/docs/cbdc-banking" },
		],
	},
];

export function parseDocsHref(href: string): { path: string; hash: string } {
	const i = href.indexOf("#");
	if (i === -1) return { path: href, hash: "" };
	return { path: href.slice(0, i), hash: href.slice(i) };
}

/** Hash de ubicación con forma `#ancla` o cadena vacía (inicio de página). */
function canonicalLocationHash(hash: string): string {
	if (!hash || hash === "#") return "";
	return hash.startsWith("#") ? hash : `#${hash}`;
}

/**
 * Ítem activo: misma ruta y, si el enlace lleva #ancla, la misma ancla.
 * Enlaces sin hash = inicio de esa ruta: activos solo sin ancla (o `#overview` explícito).
 */
export function isDocsNavItemActive(
	item: DocsNavItem,
	pathname: string,
	hash: string,
): boolean {
	const { path, hash: itemHash } = parseDocsHref(item.href);
	if (pathname !== path) return false;

	const have = canonicalLocationHash(hash);

	if (itemHash) {
		if (itemHash === "#overview") {
			const overviewPaths = new Set([
				"/docs",
				"/docs/design-system",
				"/docs/visuals",
			]);
			if (overviewPaths.has(path)) {
				return have === "" || have === "#overview";
			}
		}
		return have === itemHash;
	}

	if (item.href === "/docs") {
		return have === "" || have === "#overview";
	}

	return have === "" || have === "#overview";
}

export type DocsNavShellVariant = "design-system" | "media-kit" | "public";

export function getDocsNavContext(pathname: string): {
	groups: readonly DocsNavGroup[];
	ariaLabel: string;
	variant: DocsNavShellVariant;
} {
	if (pathname === "/docs/design-system") {
		return {
			groups: DOCS_DESIGN_SYSTEM_GROUPS,
			ariaLabel: "Design system: secciones y enlaces",
			variant: "design-system",
		};
	}
	if (pathname === "/docs/visuals") {
		return {
			groups: DOCS_MEDIA_KIT_GROUPS,
			ariaLabel: "Media kit: secciones y enlaces",
			variant: "media-kit",
		};
	}
	return {
		groups: DOCS_PUBLIC_GROUPS,
		ariaLabel: "Documentación: secciones y enlaces",
		variant: "public",
	};
}

/** Flat index for command palette / search (deduped by href + label). */
export type DocsSearchEntry = {
	label: string;
	href: string;
	group: string;
};

function collectSearchEntries(
	groups: readonly DocsNavGroup[],
): DocsSearchEntry[] {
	const seen = new Set<string>();
	const out: DocsSearchEntry[] = [];
	for (const g of groups) {
		for (const item of g.items) {
			const key = `${item.href}\0${item.label}`;
			if (seen.has(key)) continue;
			seen.add(key);
			out.push({ label: item.label, href: item.href, group: g.title });
		}
	}
	return out;
}

/**
 * Índice manual + secciones derivadas (tokens, anclas). Para búsqueda full-text
 * en muchas páginas, evaluar Pagefind o DocSearch en CI.
 */
export function getDocsSearchIndex(): DocsSearchEntry[] {
	const seen = new Set<string>();
	const merged: DocsSearchEntry[] = [];
	const extended: DocsSearchEntryExtended[] = getExtendedDocsSearchEntries();
	for (const e of [
		...collectSearchEntries(DOCS_DESIGN_SYSTEM_GROUPS),
		...collectSearchEntries(DOCS_MEDIA_KIT_GROUPS),
		...collectSearchEntries(DOCS_PUBLIC_GROUPS),
		...extended,
	]) {
		const key = `${e.href}\0${e.label}`;
		if (seen.has(key)) continue;
		seen.add(key);
		merged.push(e);
	}
	return merged;
}
