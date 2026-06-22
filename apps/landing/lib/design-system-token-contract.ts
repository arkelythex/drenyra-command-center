export type TokenCategory =
	| "neutrals"
	| "brand"
	| "semantic-states"
	| "semantic-colors"
	| "radius"
	| "fonts"
	| "spacing";

export interface TokenBase {
	name: string;
	value: string;
	usage: string;
}

export interface ColorToken extends TokenBase {
	swatch: string;
}

export interface RadiusToken extends TokenBase {
	preview: {
		kind: "radius";
		className: string;
		label: string;
	};
}

export interface FontToken extends TokenBase {
	preview: {
		kind: "font";
		className: string;
		sample: string;
	};
}

export interface SpacingToken extends TokenBase {
	preview: {
		kind: "spacing";
		pixels: string;
	};
}

export interface TokenSection<TToken extends TokenBase> {
	category: TokenCategory;
	title: string;
	description: string;
	tokens: readonly TToken[];
}

/** Monochrome neutrals — Light theme (:root) */
export const neutralColorTokens = [
	{
		name: "--neutral-100",
		value: "#F5F5F0",
		usage: "Fondo suave / canvas",
		swatch: "#F5F5F0",
	},
	{
		name: "--neutral-200",
		value: "#E8E8E3",
		usage: "Superficies card",
		swatch: "#E8E8E3",
	},
	{
		name: "--neutral-300",
		value: "#D4D4D0",
		usage: "Bordes y separación",
		swatch: "#D4D4D0",
	},
	{
		name: "--neutral-400",
		value: "#A3A39E",
		usage: "Eyebrows y labels (WCAG sobre blanco).",
		swatch: "#A3A39E",
	},
	{
		name: "--neutral-500",
		value: "#6B6B66",
		usage: "Texto secundario / body muted",
		swatch: "#6B6B66",
	},
	{
		name: "--neutral-600",
		value: "#4A4A45",
		usage: "Bordes fuertes",
		swatch: "#4A4A45",
	},
	{
		name: "--neutral-700",
		value: "#3A3A35",
		usage: "Controles inactivos",
		swatch: "#3A3A35",
	},
	{
		name: "--neutral-800",
		value: "#2D2D28",
		usage: "Elevado / chrome",
		swatch: "#2D2D28",
	},
	{
		name: "--neutral-900",
		value: "#1A1A17",
		usage: "Texto primario / charcoal",
		swatch: "#1A1A17",
	},
] as const satisfies readonly ColorToken[];

export const brandColorTokens = [
	{
		name: "--brand-700",
		value: "#2D2D28",
		usage: "Hover y estados apagados CTA",
		swatch: "#2D2D28",
	},
	{
		name: "--brand-600",
		value: "#3A3A35",
		usage: "CTA relleno por defecto",
		swatch: "#3A3A35",
	},
	{
		name: "--brand-500",
		value: "#6B6B66",
		usage: "Marca: acción / anillo foco",
		swatch: "#6B6B66",
	},
	{
		name: "--brand-400",
		value: "#9A9A9A",
		usage: "Acentos y highlights ligeros",
		swatch: "#9A9A9A",
	},
] as const satisfies readonly ColorToken[];

export const semanticStateColorTokens = [
	{
		name: "--success",
		value: "#2D8A4E",
		usage: "Validado, OK",
		swatch: "#2D8A4E",
	},
	{
		name: "--info",
		value: "#2563EB",
		usage: "Información",
		swatch: "#2563EB",
	},
	{
		name: "--warning",
		value: "#D97706",
		usage: "Observación, revisión",
		swatch: "#D97706",
	},
	{
		name: "--danger",
		value: "#DC2626",
		usage: "Riesgo medio",
		swatch: "#DC2626",
	},
	{
		name: "--critical",
		value: "#991B1B",
		usage: "Riesgo crítico / destrucción",
		swatch: "#991B1B",
	},
] as const satisfies readonly ColorToken[];

/** Aliases usados por Tailwind / shadcn (landing + docs) */
export const semanticColorTokens = [
	{
		name: "--color-background",
		value: "#FAFAF8",
		usage: "Canvas principal (crema institucional).",
		swatch: "#FAFAF8",
	},
	{
		name: "--color-surface",
		value: "#F5F5F0",
		usage: "Cards y contenedores.",
		swatch: "#F5F5F0",
	},
	{
		name: "--color-surface-hover",
		value: "#E8E8E3",
		usage: "Hover en superficies elevadas.",
		swatch: "#E8E8E3",
	},
	{
		name: "--color-text",
		value: "#1A1A17",
		usage: "Copy principal (charcoal sobre crema).",
		swatch: "#1A1A17",
	},
	{
		name: "--color-text-muted",
		value: "#6B6B66",
		usage: "Descripciones y metadata (contraste AA sobre #FAFAF8).",
		swatch: "#6B6B66",
	},
	{
		name: "--color-text-inverse",
		value: "#FAFAF8",
		usage: "Texto sobre fondos oscuros o brand.",
		swatch: "#FAFAF8",
	},
	{
		name: "--color-border",
		value: "#D4D4D0",
		usage: "Bordes y divisores técnicos.",
		swatch: "#D4D4D0",
	},
	{
		name: "--color-border-strong",
		value: "#A3A39E",
		usage: "Énfasis de borde y estados focus.",
		swatch: "#A3A39E",
	},
	{
		name: "--color-primary",
		value: "#2D2D28",
		usage: "CTA, foco, acentos de marca (charcoal).",
		swatch: "#2D2D28",
	},
	{
		name: "--color-primary-foreground",
		value: "#FAFAF8",
		usage: "Texto sobre acciones primarias.",
		swatch: "#FAFAF8",
	},
	{
		name: "--color-accent",
		value: "#4A4A45",
		usage: "Highlights y enlaces secundarios (gris cálido).",
		swatch: "#4A4A45",
	},
	{
		name: "--color-accent-foreground",
		value: "#FAFAF8",
		usage: "Texto sobre acento oscuro (marca).",
		swatch: "#FAFAF8",
	},
	{
		name: "--color-accent-secondary",
		value: "#6B6B66",
		usage: "Shimmer sutil, chips neutros.",
		swatch: "#6B6B66",
	},
	{
		name: "--color-section-label",
		value: "#6B6B66",
		usage: "Eyebrows / kickers de sección (contraste AA sobre crema).",
		swatch: "#6B6B66",
	},
] as const satisfies readonly ColorToken[];

export const radiusTokens = [
	{
		name: "--radius",
		value: "0.625rem",
		usage: "Base controles (10px) — botones, inputs.",
		preview: { kind: "radius", className: "rounded-[0.625rem]", label: "Base" },
	},
	{
		name: "--radius-sm",
		value: "0.375rem",
		usage: "Compacto (6px).",
		preview: { kind: "radius", className: "rounded-[0.375rem]", label: "S" }, // eslint-disable-line design-tokens/no-hardcoded-design-values
	},
	{
		name: "--radius-md",
		value: "0.625rem",
		usage: "Medio (10px).",
		preview: { kind: "radius", className: "rounded-[0.625rem]", label: "M" },
	},
	{
		name: "--radius-lg",
		value: "0.875rem",
		usage: "Cards (14px).",
		preview: { kind: "radius", className: "rounded-[0.875rem]", label: "L" },
	},
	{
		name: "--radius-xl",
		value: "1.25rem",
		usage: "Paneles y modales (20px).",
		preview: { kind: "radius", className: "rounded-[1.25rem]", label: "XL" },
	},
] as const satisfies readonly RadiusToken[];

export const fontTokens = [
	{
		name: "--font-sans",
		value: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
		usage: "UI y cuerpo (Inter; fallback system).",
		preview: {
			kind: "font",
			className: "font-sans",
			sample: "Inter / interfaz",
		},
	},
	{
		name: "--font-display",
		value: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
		usage: "Display / hero (Inter).",
		preview: {
			kind: "font",
			className: "font-display",
			sample: "Inter / display",
		},
	},
	{
		name: "--font-mono",
		value: "var(--font-jetbrains), ui-monospace, monospace",
		usage: "Código, trazas, RUC, hashes.",
		preview: { kind: "font", className: "font-mono", sample: "JetBrains Mono" },
	},
] as const satisfies readonly FontToken[];

export const spacingTokens = [
	{
		name: "--space-1",
		value: "4px",
		usage: "Micro gap",
		preview: { kind: "spacing", pixels: "4" },
	},
	{
		name: "--space-2",
		value: "8px",
		usage: "Gap denso",
		preview: { kind: "spacing", pixels: "8" },
	},
	{
		name: "--space-3",
		value: "12px",
		usage: "Padding chip",
		preview: { kind: "spacing", pixels: "12" },
	},
	{
		name: "--space-4",
		value: "16px",
		usage: "Base padding",
		preview: { kind: "spacing", pixels: "16" },
	},
	{
		name: "--space-6",
		value: "24px",
		usage: "Sección densa",
		preview: { kind: "spacing", pixels: "24" },
	},
	{
		name: "--space-8",
		value: "32px",
		usage: "Bloque",
		preview: { kind: "spacing", pixels: "32" },
	},
	{
		name: "--space-12",
		value: "48px",
		usage: "Sección",
		preview: { kind: "spacing", pixels: "48" },
	},
	{
		name: "--space-16",
		value: "64px",
		usage: "Sección ancha",
		preview: { kind: "spacing", pixels: "64" },
	},
	{
		name: "--space-24",
		value: "96px",
		usage: "Hero / ancla",
		preview: { kind: "spacing", pixels: "96" },
	},
] as const satisfies readonly SpacingToken[];

/** Todas las filas de :root con `name: value;` usadas en el test de alineación */
export const globalsRootLiterals: readonly { name: string; value: string }[] = [
	...neutralColorTokens,
	...brandColorTokens,
	...semanticStateColorTokens,
	...semanticColorTokens,
	...radiusTokens.map((r) => ({ name: r.name, value: r.value })),
	...fontTokens.map((f) => ({ name: f.name, value: f.value })),
	...spacingTokens.map((s) => ({ name: s.name, value: s.value })),
];

export const designSystemTokenSections: readonly TokenSection<TokenBase>[] = [
	{
		category: "neutrals",
		title: "Neutros",
		description: "Escala monocromática: negro, grises, blanco.",
		tokens: neutralColorTokens,
	},
	{
		category: "brand",
		title: "Marca (monocromo)",
		description: "CTA blanco y grises — sin color de acento.",
		tokens: brandColorTokens,
	},
	{
		category: "semantic-states",
		title: "Semántica (riesgo / estado)",
		description: "Clasificación de severidad y mensajes fiscales.",
		tokens: semanticStateColorTokens,
	},
	{
		category: "semantic-colors",
		title: "Aliases de producto",
		description: "Tokens mapeados a componentes (Tailwind / shadcn).",
		tokens: semanticColorTokens,
	},
	{
		category: "radius",
		title: "Radius",
		description:
			"Controles, cards, modales: sensación estructurada, no “app redonda”.",
		tokens: radiusTokens,
	},
	{
		category: "fonts",
		title: "Tipografía",
		description:
			"Inter (UI + display) / JetBrains Mono (código).",
		tokens: fontTokens,
	},
	{
		category: "spacing",
		title: "Espaciado (4px)",
		description: "Escala 4pt para secciones, gaps y respiro.",
		tokens: spacingTokens,
	},
];
