import { BarChart3 } from "lucide-react";
import type { PageHeader, ColorToken, TypographyStyle, LogoVariant } from "@/lib/types/docs";

export const visualsHeader: PageHeader = {
	badge: { text: "Media Kit", icon: BarChart3 },
	title: "Recursos de",
	highlight: "Marca",
	description:
		"Descarga logos, guías de marca, y recursos oficiales de Arkelythex para uso en medios, partnerships, y materiales de comunicación.",
};

export const colorTokens: ColorToken[] = [
	{
		name: "Brand",
		hex: "#FAFAFA",
		usage: "CTA, foco (monocromo)",
		cssVar: "--primary",
	},
	{
		name: "Accent",
		hex: "#D4D4D4",
		usage: "Highlights secundarios",
		cssVar: "--color-accent",
	},
	{
		name: "Background",
		hex: "#0A0A0A",
		usage: "Canvas principal",
		cssVar: "--background",
	},
	{
		name: "Surface",
		hex: "#111111",
		usage: "Cards y paneles",
		cssVar: "--card",
	},
	{
		name: "Text muted",
		hex: "#A3A3A3",
		usage: "Metadata, descripciones",
		cssVar: "--muted-foreground",
	},
	{
		name: "Border",
		hex: "#2E2E2E",
		usage: "Bordes técnicos",
		cssVar: "--border",
	},
];

export const typographyStyles: TypographyStyle[] = [
	{
		name: "Heading 1",
		size: "48-60px",
		weight: "600",
		lineHeight: "1.25",
		letterSpacing: "-0.05em",
		usage: "Títulos principales",
	},
	{
		name: "Heading 2",
		size: "30-36px",
		weight: "600",
		lineHeight: "1.375",
		letterSpacing: "-0.025em",
		usage: "Secciones",
	},
	{
		name: "Heading 3",
		size: "20-24px",
		weight: "600",
		lineHeight: "1.5",
		usage: "Subsecciones",
	},
	{
		name: "Body Large",
		size: "18px",
		weight: "400",
		lineHeight: "1.625",
		usage: "Párrafos introductorios",
	},
	{
		name: "Body",
		size: "16px",
		weight: "400",
		lineHeight: "1.625",
		usage: "Contenido general",
	},
	{
		name: "Caption",
		size: "14px",
		weight: "400",
		lineHeight: "1.5",
		usage: "Metadata, captions",
	},
];

export const logoVariants: LogoVariant[] = [
	{
		name: "Principal",
		background: "dark",
		colors: "Institutional compass emblem (v0.2)",
		usage: "Uso general",
		formats: ["SVG", "PNG", "PDF"],
	},
	{
		name: "Invertido",
		background: "light",
		colors: "Negro sobre blanco",
		usage: "Impresos / fondos claros",
		formats: ["SVG", "PNG"],
	},
];

export const brandVoice = {
	do: [
		"Transforma tu contabilidad",
		"Automatización inteligente",
		"Control con evidencia",
		"Hecho para PYMES peruanas",
	],
	dont: [
		"El mejor software del mundo",
		"Solución milagrosa",
		"Nunca tendrás problemas",
		"Jerga técnica excesiva",
	],
};

export const contactInfo = {
	press: "press@arkelythexfounders.com",
	phone: "+51926437404",
	legal: "legal@arkelythexfounders.com",
};
