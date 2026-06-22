/**
 * Arkelythex SEO Configuration 2026
 * Next.js 15 App Router Metadata API optimized
 * Following 2026 SEO best practices and Core Web Vitals
 */

import type { Metadata } from "next";

// ============================================================================
// BASE CONFIGURATION
// ============================================================================

/**
 * URL canónica del sitio (metadata, OG, sitemap).
 * - Vercel define `VERCEL_URL` en build/runtime (previews y deploys sin configurar nada).
 * - Opcional: `NEXT_PUBLIC_SITE_URL` en Vercel → Production = `https://arkelythexfounders.com` (dominio final).
 * - Local: sin env → fallback a producción (coherente con enlaces absolutos en SEO).
 */
function resolvePublicSiteUrl(): string {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");
	const vercel = process.env.VERCEL_URL?.split(",")[0]?.trim();
	if (vercel) return `https://${vercel}`;
	return "https://arkelythexfounders.com";
}

const publicSiteUrl = resolvePublicSiteUrl();

function resolvePublicEmail(envName: "NEXT_PUBLIC_CONTACT_EMAIL" | "NEXT_PUBLIC_LEGAL_EMAIL"): string {
	const fromEnv = process.env[envName]?.trim();
	return fromEnv || "arkelythexfounders@gmail.com";
}

function resolvePublicWhatsAppNumber(): string {
	const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
	return fromEnv || "51926437404";
}

export const siteConfig = {
	name: "Arkelythex",
	description:
		"Inteligencia fiscal verificable para economías de alta fricción. Drenyra operacionaliza compliance, evidencia y control sobre SUNAT, bancos y cierres contables.",
	url: publicSiteUrl,
	ogImage: `${publicSiteUrl}/api/og`,
	twitterHandle: "@arkalythix",
	locale: "es_PE",
	currency: "PEN",
	country: "PE",
	/** Dominio corporativo (contacto, soporte, prensa). */
	emailDomain: "gmail.com",
	/** Contacto público (footer, CTAs mailto). */
	contactEmail: resolvePublicEmail("NEXT_PUBLIC_CONTACT_EMAIL"),
	/** Contacto legal/privacidad público. */
	legalEmail: resolvePublicEmail("NEXT_PUBLIC_LEGAL_EMAIL"),
	/** WhatsApp Business (E.164 sin +). */
	whatsappNumber: resolvePublicWhatsAppNumber(),
} as const;

// ============================================================================
// DEFAULT METADATA
// ============================================================================

export const defaultMetadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: `${siteConfig.name} - Command Center Fiscal para Perú`,
		template: `%s | ${siteConfig.name}`,
	},
	description: siteConfig.description,
	keywords: [
		"command center fiscal",
		"fiscal intelligence",
		"infraestructura fiscal",
		"facturación electrónica",
		"SUNAT",
		"contabilidad",
		"AI accounting",
		"high-friction economy",
		"Arkelythex",
		"Drenyra",
	],
	authors: [{ name: "Arkelythex Team", url: siteConfig.url }],
	creator: "Arkelythex",
	publisher: "Arkelythex",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: "/",
		languages: {
			"es-PE": "/",
			es: "/",
		},
	},
	openGraph: {
		type: "website",
		locale: siteConfig.locale,
		url: siteConfig.url,
		siteName: siteConfig.name,
		title: `${siteConfig.name} - Command Center Fiscal`,
		description: siteConfig.description,
		images: [
			{
				url: siteConfig.ogImage,
				width: 1200,
				height: 630,
				alt: "Arkelythex - Command Center Fiscal para Perú",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `${siteConfig.name} - Command Center Fiscal`,
		description: siteConfig.description,
		images: [siteConfig.ogImage],
		creator: siteConfig.twitterHandle,
		site: siteConfig.twitterHandle,
	},
	verification: {
		google: "google-site-verification-code",
		yandex: "yandex-verification-code",
	},
	category: "technology",
	classification: "business",
	referrer: "origin-when-cross-origin",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/brand/icon.svg", type: "image/svg+xml" },
		],
		shortcut: "/favicon-16x16.png",
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180" },
			{ url: "/apple-touch-icon-152x152.png", sizes: "152x152" },
			{ url: "/apple-touch-icon-120x120.png", sizes: "120x120" },
			{ url: "/apple-touch-icon-76x76.png", sizes: "76x76" },
		],
		other: [
			{
				rel: "apple-touch-icon-precomposed",
				url: "/apple-touch-icon-precomposed.png",
			},
		],
	},
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: siteConfig.name,
		startupImage: [
			{
				url: "/apple-splash-2048-2732.jpg",
				media: "(device-width: 1024px) and (device-height: 1366px)",
			},
		],
	},
	applicationName: siteConfig.name,
	other: {
		"msapplication-TileColor": "#000000",
		"msapplication-TileImage": "/mstile-144x144.png",
		"msapplication-config": "/browserconfig.xml",
	},
};

// ============================================================================
// PAGE-SPECIFIC METADATA GENERATORS
// ============================================================================

export function generatePageMetadata({
	title,
	description,
	path,
	ogImage,
	noIndex = false,
}: {
	title: string;
	description: string;
	path: string;
	ogImage?: string;
	noIndex?: boolean;
}): Metadata {
	const url = `${siteConfig.url}${path}`;

	return {
		title,
		description,
		alternates: {
			canonical: path,
		},
		robots: noIndex
			? {
					index: false,
					follow: false,
				}
			: defaultMetadata.robots,
		openGraph: {
			...defaultMetadata.openGraph,
			title,
			description,
			url,
			images: ogImage
				? [
						{
							url: ogImage,
							width: 1200,
							height: 630,
							alt: title,
						},
					]
				: defaultMetadata.openGraph?.images,
		},
		twitter: {
			...defaultMetadata.twitter,
			title,
			description,
			images: ogImage ? [ogImage] : defaultMetadata.twitter?.images,
		},
	};
}

// ============================================================================
// DOCS PAGE METADATA
// ============================================================================

export const docsMetadata = {
	docsIndex: generatePageMetadata({
		title: "Documentación pública",
		description:
			"Punto de entrada a la documentación pública de Arkelythex: design system, arquitectura, compliance SUNAT y materiales de negocio.",
		path: "/docs",
		ogImage: siteConfig.ogImage,
	}),

	designSystem: generatePageMetadata({
		title: "Design System | Foundations y tokens",
		description:
			"Foundations, tokens y primitivas compartidas del frontend de Arkelythex.",
		path: "/docs/design-system",
		ogImage: siteConfig.ogImage,
	}),

	investors: generatePageMetadata({
		title: "Inversores | Oportunidad de Inversión Pre-Seed",
		description:
			"Oportunidad de inversión en Arkelythex: plataforma de inteligencia fiscal con IA para 2.5M PYMES peruanas. Pitch deck, métricas y roadmap.",
		path: "/docs/investors",
		ogImage: siteConfig.ogImage,
	}),

	vision: generatePageMetadata({
		title: "Visión 2026-2030 | Construyendo el Futuro Financiero",
		description:
			"Nuestra visión: digitalizar 50% de PYMES peruanas para 2030. Soberanía digital, inclusión financiera e innovación continua.",
		path: "/docs/vision",
		ogImage: siteConfig.ogImage,
	}),

	roadmap: generatePageMetadata({
		title: "Roadmap 2025-2026 | Hoja de Ruta Arkelythex",
		description:
			"Hoja de ruta detallada: entrada al mercado, expansión operativa, plataforma empresarial y liderazgo regional.",
		path: "/docs/roadmap",
		ogImage: siteConfig.ogImage,
	}),

	visuals: generatePageMetadata({
		title: "Media Kit | Recursos de Marca Arkelythex",
		description:
			"Descarga logos, guías de marca, paleta de colores y tipografía. Recursos oficiales para medios y partnerships.",
		path: "/docs/visuals",
		ogImage: siteConfig.ogImage,
	}),

	architecture: generatePageMetadata({
		title: "Arquitectura | Stack Tecnológico 2026",
		description:
			"Arquitectura técnica: Next.js 15, Hono, Bun, PostgreSQL, Redis, Rust/WASM. Sistema escalable y seguro.",
		path: "/docs/architecture",
		ogImage: siteConfig.ogImage,
	}),

	sovereignCore: generatePageMetadata({
		title: "Sovereign Core™ | Motor Financiero Rust/WASM",
		description:
			"Motor financiero inmutable en Rust y WebAssembly. Soberanía de datos, privacidad zero-knowledge, 10x performance.",
		path: "/docs/sovereign-core",
		ogImage: siteConfig.ogImage,
	}),

	sunatCompliance: generatePageMetadata({
		title: "SUNAT Compliance | Cumplimiento Tributario Peruano",
		description:
			"Cumplimiento operativo con SUNAT: PLE, SIRE, facturación electrónica y detracciones con trazabilidad y validaciones previas.",
		path: "/docs/sunat-compliance",
		ogImage: siteConfig.ogImage,
	}),

	cbdcBanking: generatePageMetadata({
		title: "CBDC & Banking | Moneda Digital Banco Central",
		description:
			"Integración nativa CBDC: pagos instantáneos, programables, interoperables. Preparado para el futuro financiero.",
		path: "/docs/cbdc-banking",
		ogImage: siteConfig.ogImage,
	}),
};

// ============================================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================================

export function generateOrganizationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: siteConfig.name,
		url: siteConfig.url,
		logo: `${siteConfig.url}/brand/logo.svg`,
		description: siteConfig.description,
			contactPoint: {
			"@type": "ContactPoint",
			email: siteConfig.contactEmail,
			contactType: "customer support",
			areaServed: "PE",
			availableLanguage: ["Spanish"],
		},
		address: {
			"@type": "PostalAddress",
			addressCountry: "PE",
			addressLocality: "Lima",
			addressRegion: "Lima",
		},
		foundingDate: "2024",
	};
}

export function generateSoftwareApplicationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: siteConfig.name,
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web",
		featureList: [
			"Facturación electrónica SUNAT",
			"Libros electrónicos PLE/SIRE",
			"Integración con banca digital",
			"Contabilidad asistida por IA",
			"Integraciones bancarias",
		],
	};
}

export function generateBreadcrumbSchema(
	items: { name: string; url: string }[],
) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

export function generateFAQSchema(
	faqs: { question: string; answer: string }[],
) {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};
}

// ============================================================================
// PRODUCT-SPECIFIC SCHEMAS
// ============================================================================

export function generateProductSchema({
	name,
	description,
	price,
	priceCurrency = "PEN",
	category,
	features,
}: {
	name: string;
	description: string;
	price: string;
	priceCurrency?: string;
	category: string;
	features: string[];
}) {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name,
		description,
		applicationCategory: category,
		operatingSystem: "Web",
		...(price === "Custom"
			? {}
			: {
					offers: {
						"@type": "Offer",
						price,
						priceCurrency,
						priceValidUntil: "2026-12-31",
						availability: "https://schema.org/InStock",
					},
				}),
		featureList: features,
		publisher: {
			"@type": "Organization",
			name: siteConfig.name,
			url: siteConfig.url,
		},
	};
}

export const drenyraSchema = generateProductSchema({
	name: "Drenyra",
	description:
		"Plataforma integral de contabilidad inteligente para empresas peruanas. Centraliza facturación, conciliación, análisis fiscal y SIRE con agentes IA que trabajan 24/7.",
	price: "149.00",
	category: "BusinessApplication",
	features: [
		"Contabilidad operativa con evidencia",
		"Gestión multi-RUC para estudios",
		"Análisis fiscal y priorización de riesgo",
		"SIRE + facturación electrónica UBL 2.1",
		"8 agentes IA especializados",
		"Trazabilidad completa de decisiones",
	],
});

export const apiSchema = generateProductSchema({
	name: "Arkelythex API",
	description:
		"API pública tipo Stripe para el sistema tributario peruano. Consulta RUC, valida comprobantes electrónicos y genera archivos PLE/SIRE. Pago por uso, sin contratos y con entorno de pruebas.",
	price: "49.00",
	category: "DeveloperApplication",
	features: [
		"Consulta RUC en tiempo real",
		"Validación de comprobantes CPE",
		"Generación automática PLE/SIRE",
		"SDKs para Python, Node.js, Go",
		"Entorno de pruebas gratuito",
		"Pago por uso sin contratos",
	],
});

// ============================================================================
// CONVERSION PAGES SCHEMAS (Phase 3)
// ============================================================================

export const preciosSchema = generateFAQSchema([
	{
		question: "¿Puedo cambiar de plan en cualquier momento?",
		answer:
			"Sí. Durante piloto ajustamos el plan antes de activar cobro recurrente; cuando la pasarela esté habilitada, los cambios aplicarán al siguiente ciclo de facturación.",
	},
	{
		question: "¿Qué pasa si excedo el límite de comprobantes de mi plan?",
		answer:
			"Te notificamos cuando alcances el 80% de tu capacidad. En piloto revisamos volumen real y recomendamos migrar al siguiente plan antes de activar automatización de cobro.",
	},
	{
		question: "¿Los precios incluyen IGV?",
		answer:
			"No. Los precios publicados son más IGV (18%). La emisión de comprobantes se activa cuando la estructura legal y tributaria esté lista para operación comercial.",
	},
	{
		question: "¿Hay período de prueba gratuito?",
		answer:
			"Sí. El piloto inicial es guiado y sin tarjeta. Primero validamos encaje operativo; después se formaliza plan, contrato y facturación.",
	},
	{
		question: "¿Qué métodos de pago aceptan?",
		answer:
			"Durante el MVP aceptamos coordinación manual por transferencia/Yape. La pasarela online recomendada para Perú será Culqi; Mercado Pago queda como fallback y PayPal solo para clientes internacionales.",
	},
]);

export const casosSchema = generateOrganizationSchema();

export const nosotrosSchema = generateOrganizationSchema();
