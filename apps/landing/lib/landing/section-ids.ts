/**
 * Orden único de la landing (Home).
 * Debe coincidir con la composición en `LandingPage`.
 *
 * Actualizado para alinearse con los IDs reales del DOM.
 */
export const SHELL_SECTION_ORDER = ["hero", "trust"] as const;

export const BODY_SECTION_ORDER = [
	"trust-bar",
	"stats",
	"why-it-exists",
	"social-proof",
	"request-access",
] as const;

export type ShellSectionId = (typeof SHELL_SECTION_ORDER)[number];
export type BodySectionId = (typeof BODY_SECTION_ORDER)[number];

/** Propósito de cada bloque del cuerpo. */
export const BODY_SECTION_PURPOSE: Record<BodySectionId, string> = {
	"trust-bar": "Métricas animadas con count-up",
	stats: "Misión editorial centrada",
	"why-it-exists": "5 problemas continentales con estadísticas",
	"social-proof": "Métricas de impacto + señales institucionales",
	"request-access": "CTA final de solicitud de acceso",
};

/* ─── Backward-compat aliases ─── */
export const V2_SHELL_SECTION_ORDER = SHELL_SECTION_ORDER;
export const V2_BODY_SECTION_ORDER = BODY_SECTION_ORDER;
export type V2ShellSectionId = ShellSectionId;
export type V2BodySectionId = BodySectionId;
export const V2_BODY_SECTION_PURPOSE = BODY_SECTION_PURPOSE;
