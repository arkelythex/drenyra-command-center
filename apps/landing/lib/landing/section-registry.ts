/**
 * Registro único: IDs de ancla del DOM por sección del cuerpo + metadatos de carga y navbar.
 * Cualquier cambio de hash debe hacerse aquí y en los componentes vía estas constantes.
 *
 * Estructura streamlindeada: ~5 secciones de cuerpo.
 */

import { BODY_SECTION_ORDER, type BodySectionId } from "@/lib/landing/section-ids";

/** Ancla del hero (shell, no forma parte de BODY_SECTION_ORDER). */
export const HERO_ANCHOR = "producto" as const;

export type SectionId = "hero" | "trust" | BodySectionId;

export interface SectionNavigationTarget {
	readonly sectionId: SectionId;
	readonly anchorId: string;
	readonly href: string;
}

/** Ancla por sección del cuerpo — debe coincidir con el atributo id en el DOM. */
export const BODY_SECTION_ANCHORS: {
	readonly [K in BodySectionId]: string;
} = {
	"trust-bar": "confianza",
	stats: "stats",
	"why-it-exists": "why-it-exists",
	"social-proof": "por-que-arkelythex",
	"request-access": "request-access",
};

/** Secciones cargadas con `next/dynamic` en el cuerpo (JS diferido). */
export const BODY_LAZY_IDS =
	[] as const satisfies readonly BodySectionId[];

export type LazyBodySectionId = (typeof BODY_LAZY_IDS)[number];

export type EagerBodySectionId = Exclude<
	BodySectionId,
	LazyBodySectionId
>;

export const BODY_LAZY_SECTIONS: ReadonlySet<BodySectionId> = new Set(
	BODY_LAZY_IDS,
);

export function isBodySectionLazy(
	id: BodySectionId,
): id is LazyBodySectionId {
	return BODY_LAZY_SECTIONS.has(id);
}

export type NavbarLink = { readonly label: string; readonly href: string };

/**
 * Enlaces del navbar principal (orden de lectura). Subconjunto de anclas; el resto sigue siendo alcanzable por scroll.
 */
export const NAVBAR_LINKS: readonly NavbarLink[] = [
	{ label: "Drenyra", href: "/drenyra" },
	{ label: "Capacidades", href: "/drenyra#drenyra-modulos" },
	{ label: "Agentes IA", href: "/drenyra#drenyra-agentes" },
	{ label: "Precios", href: "/drenyra#drenyra-pricing" },
] as const;

/** href con hash normalizado (para tests y validación). */
export function hashHref(anchorId: string): string {
	return anchorId.startsWith("#") ? anchorId : `#${anchorId}`;
}

const SECTION_NAVIGATION_TARGETS: readonly SectionNavigationTarget[] = [
	{
		sectionId: "hero",
		anchorId: HERO_ANCHOR,
		href: hashHref(HERO_ANCHOR),
	},
	{ sectionId: "trust", anchorId: "trust", href: hashHref("trust") },
	...BODY_SECTION_ORDER.map((sectionId) => ({
		sectionId,
		anchorId: BODY_SECTION_ANCHORS[sectionId],
		href: hashHref(BODY_SECTION_ANCHORS[sectionId]),
	})),
];

const SECTION_NAVIGATION_TARGETS_BY_HASH: ReadonlyMap<
	string,
	SectionNavigationTarget
> = new Map(
	SECTION_NAVIGATION_TARGETS.map((target) => [target.href, target]),
);

export function resolveSectionNavigationTarget(
	href: string,
): SectionNavigationTarget | null {
	return SECTION_NAVIGATION_TARGETS_BY_HASH.get(hashHref(href)) ?? null;
}

/* ─── Backward-compat aliases ─── */
export const V2_HERO_ANCHOR = HERO_ANCHOR;
export type V2SectionId = SectionId;
export const V2_BODY_SECTION_ANCHORS = BODY_SECTION_ANCHORS;
export const V2_BODY_LAZY_IDS = BODY_LAZY_IDS;
export type V2LazyBodySectionId = LazyBodySectionId;
export type V2EagerBodySectionId = EagerBodySectionId;
export const V2_BODY_LAZY_SECTIONS = BODY_LAZY_SECTIONS;
export const isV2BodySectionLazy = isBodySectionLazy;
export type V2NavbarLink = NavbarLink;
export const V2_NAVBAR_LINKS = NAVBAR_LINKS;
export const v2HashHref = hashHref;
export const V2_SECTION_NAVIGATION_TARGETS = SECTION_NAVIGATION_TARGETS;
export const V2_SECTION_NAVIGATION_TARGETS_BY_HASH = SECTION_NAVIGATION_TARGETS_BY_HASH;
export const resolveV2SectionNavigationTarget = resolveSectionNavigationTarget;
