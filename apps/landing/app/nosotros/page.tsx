import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { NosotrosPage } from "./nosotros-page";
import {
	generateBreadcrumbSchema,
	nosotrosSchema,
	siteConfig,
} from "@/lib/seo/config";

export const metadata: Metadata = {
	title: "Nosotros | Arkelythex — Plataforma de Inteligencia Fiscal",
	description:
		"Conoce al equipo detrás de Arkelythex. Construimos la plataforma de inteligencia fiscal con IA que el mercado peruano necesita. Misión, visión y valores.",
	alternates: {
		canonical: "/nosotros",
	},
	openGraph: {
		type: "website",
		locale: "es_PE",
		url: "https://arkelythexfounders.com/nosotros",
		siteName: "Arkelythex",
		title: "Nosotros | Arkelythex — Plataforma de Inteligencia Fiscal",
		description:
			"Conoce al equipo detrás de Arkelythex. Construimos la plataforma de inteligencia fiscal con IA que el mercado peruano necesita.",
		images: [
			{
				url: "/api/og?title=Nosotros&subtitle=Plataforma%20de%20Inteligencia%20Fiscal&accent=FAFAFA",
				width: 1200,
				height: 630,
				alt: "Nosotros - Arkelythex",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		site: "@arkalythix",
		creator: "@arkalythix",
		title: "Nosotros | Arkelythex — Plataforma de Inteligencia Fiscal",
		description:
			"Conoce al equipo detrás de Arkelythex. Construimos la plataforma de inteligencia fiscal con IA que el mercado peruano necesita.",
		images: [
			"/api/og?title=Nosotros&subtitle=Plataforma%20de%20Inteligencia%20Fiscal&accent=FAFAFA",
		],
	},
};

const breadcrumbSchema = generateBreadcrumbSchema([
	{ name: "Inicio", url: `${siteConfig.url}/` },
	{ name: "Nosotros", url: `${siteConfig.url}/nosotros` },
]);

export default function NosotrosRoute() {
	return (
		<main
			id="main-content"
			className="relative min-h-screen overflow-hidden bg-background text-foreground theme-oled"
			tabIndex={-1}
		>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(nosotrosSchema) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
			/>
			<Navbar />
			<NosotrosPage />
			<Footer />
		</main>
	);
}
