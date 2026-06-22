/**
 * Rutas públicas de multimedia para la home de marca (`/`).
 * Archivos bajo `apps/landing/public/` → URL `/brand/home/...`
 *
 * @see public/brand/home/README.md
 * @see docs/content/visuals.md
 */

export type BrandHomeSurfaceId = "hero";

export type BrandHomeProductId = "drenyra";

export type BrandHomeEcosystemId =
	| "sire"
	| "seguridad"
	| "api"
	| "gov"
	| "grid";

export type BrandMediaAsset = {
	readonly src: string;
	readonly alt: string;
};

/** Prefijo URL (Next sirve `public/` en la raíz del sitio). */
export const BRAND_HOME_MEDIA_BASE = "/brand/home" as const;

export const BRAND_HOME_SURFACE_MEDIA: Record<
	BrandHomeSurfaceId,
	BrandMediaAsset
> = {
	hero: {
		src: `${BRAND_HOME_MEDIA_BASE}/hero.webp`,
		alt: "Arkelythex — plataforma fiscal",
	},
};

export const BRAND_HOME_PRODUCT_MEDIA: Record<
	BrandHomeProductId,
	BrandMediaAsset
> = {
	drenyra: {
		src: `${BRAND_HOME_MEDIA_BASE}/drenyra.webp`,
		alt: "Drenyra — command center fiscal",
	},
};

export const BRAND_HOME_ECOSYSTEM_MEDIA: Record<
	BrandHomeEcosystemId,
	BrandMediaAsset
> = {
	sire: {
		src: `${BRAND_HOME_MEDIA_BASE}/ecosystem/sire.webp`,
		alt: "SIRE",
	},
	seguridad: {
		src: `${BRAND_HOME_MEDIA_BASE}/ecosystem/seguridad.webp`,
		alt: "Seguridad",
	},
	api: {
		src: `${BRAND_HOME_MEDIA_BASE}/ecosystem/api.webp`,
		alt: "API Docs",
	},
	gov: {
		src: `${BRAND_HOME_MEDIA_BASE}/ecosystem/gov.webp`,
		alt: "Gov — gobierno de datos",
	},
	grid: {
		src: `${BRAND_HOME_MEDIA_BASE}/ecosystem/grid.webp`,
		alt: "Grid — infraestructura de datos",
	},
};

/** Video opcional del hero (reemplaza imagen estática si se implementa en el componente). */
export const BRAND_HOME_HERO_VIDEO = {
	src: `${BRAND_HOME_MEDIA_BASE}/hero.mp4`,
	poster: BRAND_HOME_SURFACE_MEDIA.hero.src,
} as const;
