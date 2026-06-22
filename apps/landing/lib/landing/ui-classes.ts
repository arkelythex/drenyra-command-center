/**
 * Shared Tailwind class fragments for marketing surfaces.
 * Use solid token colors — avoid `text-muted-foreground/XX` (fails WCAG on #000).
 */

/** Section eyebrow / kicker (12px min, section-label color) */
export const LANDING_EYEBROW_CLASS = "landing-eyebrow";

/** Body secondary copy */
export const LANDING_BODY_MUTED_CLASS = "landing-body-muted leading-relaxed";

/** Captions and meta */
export const LANDING_CAPTION_CLASS = "landing-caption";

/** Inline text link (not a button) */
export const LANDING_LINK_CLASS =
	"landing-text-link inline-flex items-center gap-2 text-sm font-medium text-foreground";

/** Card / panel shell */
export const LANDING_CARD_CLASS =
	"rounded-lg border landing-border landing-surface";

/** Dividers */
export const LANDING_DIVIDER_CLASS = "border-t landing-border";
