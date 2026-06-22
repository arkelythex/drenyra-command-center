/**
 * Rutas y especificaciones de multimedia para `/drenyra`.
 * Archivos bajo `apps/landing/public/` → URL `/brand/drenyra/...`
 *
 * Codex: generar WebP según `public/brand/drenyra/source/2026-05-22-terminal-intelligence.md`
 */

export type DrenyraMediaSlotId =
	| "hero-agent"
	| "workflow"
	| "feature-sire"
	| "feature-igv"
	| "feature-detracciones"
	| "feature-domain"
	| "trust";

export type DrenyraMediaAsset = {
	readonly id: DrenyraMediaSlotId;
	readonly src: string;
	readonly alt: string;
	readonly width: number;
	readonly height: number;
	readonly codexBrief: string;
};

const DRENYRA_MEDIA_BASE = "/brand/drenyra" as const;

export const DRENYRA_MEDIA_ASSETS: Record<DrenyraMediaSlotId, DrenyraMediaAsset> = {
	"hero-agent": {
		id: "hero-agent",
		src: `${DRENYRA_MEDIA_BASE}/hero-agent.webp`,
		alt: "Drenyra Agent Workspace — ventana macOS con agente fiscal en acción",
		width: 1920,
		height: 1080,
		codexBrief:
			"Hero: macOS window on dark graphite gradient with warm sepia paper texture. Drenyra agent UI exploring fiscal code, RUC validation, teal/cyan accents. No readable third-party logos. Premium glass shadow.",
	},
	workflow: {
		id: "workflow",
		src: `${DRENYRA_MEDIA_BASE}/workflow.webp`,
		alt: "Flujo del agente Drenyra — pasos de cierre fiscal",
		width: 1200,
		height: 900,
		codexBrief:
			"Workflow diagram as subtle terminal panels: ingest, risk, human gate, audit pack. Monochrome + teal highlights, Peruvian fiscal context.",
	},
	"feature-sire": {
		id: "feature-sire",
		src: `${DRENYRA_MEDIA_BASE}/feature-sire.webp`,
		alt: "Drenyra validando registros SIRE",
		width: 800,
		height: 600,
		codexBrief:
			"Mini terminal scene: SIRE RVIE contrast with CPE. Clean, trustworthy, dark UI with emerald success states.",
	},
	"feature-igv": {
		id: "feature-igv",
		src: `${DRENYRA_MEDIA_BASE}/feature-igv.webp`,
		alt: "Drenyra detectando discrepancias de IGV",
		width: 800,
		height: 600,
		codexBrief:
			"Mini terminal: IGV discrepancy detection, Vigila agent. Alert red subtle, cyan active cursor.",
	},
	"feature-detracciones": {
		id: "feature-detracciones",
		src: `${DRENYRA_MEDIA_BASE}/feature-detracciones.webp`,
		alt: "Drenyra ejecutando tests de detracciones",
		width: 800,
		height: 600,
		codexBrief:
			"Mini terminal: detracciones test suite running, monospace logs, professional accounting vibe.",
	},
	"feature-domain": {
		id: "feature-domain",
		src: `${DRENYRA_MEDIA_BASE}/feature-domain.webp`,
		alt: "Drenyra explorando dominio fiscal",
		width: 800,
		height: 600,
		codexBrief:
			"Mini terminal: exploring @arkelythex/domain fiscal modules, engineering tool aesthetic, warm beige code comments on dark.",
	},
	trust: {
		id: "trust",
		src: `${DRENYRA_MEDIA_BASE}/trust.webp`,
		alt: "Equipos peruanos confiando en Drenyra",
		width: 1600,
		height: 600,
		codexBrief:
			"Trust strip: abstract silhouettes of accounting teams, Peru enterprise, no fake logos, monochrome premium.",
	},
};
