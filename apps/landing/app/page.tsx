import type { ReactElement } from "react";
import type { Metadata } from "next";

import { ScrollDepthTracker } from "@/components/scroll-depth-tracker";
import { LandingPage } from "@/components/landing/landing-page";
import { LANDING_FAQS } from "@/lib/data/landing-faqs";
import { generateFAQSchema, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
	title: "Command Center Fiscal para Perú | Arkelythex",
	description:
		"Arkelythex convierte el caos fiscal peruano en expedientes verificables, revisables y accionables. SIRE, CPE, cierre mensual con evidencia y control operativo.",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Arkelythex — Command Center Fiscal",
		description:
			"El sistema operativo fiscal: operar, revisar y auditar empresas peruanas con IA + evidencia + trazabilidad.",
		url: siteConfig.url,
		siteName: siteConfig.name,
		locale: siteConfig.locale,
		type: "website",
		images: [
			{
				url: siteConfig.ogImage,
				width: 1200,
				height: 630,
				alt: "Arkelythex — Command Center Fiscal para Perú",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Arkelythex — Cumplimiento SUNAT con evidencia",
		description:
			"SIRE-first para Perú: facturación electrónica, revisión de riesgo y trazabilidad para cierres contables.",
		images: [siteConfig.ogImage],
	},
};

/**
 * WebSite schema with SearchAction for Google sitelinks search box.
 */
function generateWebSiteSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: siteConfig.name,
		url: siteConfig.url,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${siteConfig.url}/api?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};
}

/**
 * Home (marketing): landing v2 + FAQ JSON-LD aligned with visible FAQ content.
 * Organization schema lives in `app/layout.tsx`; product schemas are page-specific.
 */
export default function HomePage(): ReactElement {
	const faqSchema = generateFAQSchema([...LANDING_FAQS]);
	const webSiteSchema = generateWebSiteSchema();

	return (
		<div className="theme-oled">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
			/>

			<ScrollDepthTracker />
			<LandingPage />
		</div>
	);
}
