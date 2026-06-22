import type React from "react";
import type { Metadata, Viewport } from "next";
import { Cinzel, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PublicClientIslands } from "@/components/public-client-islands";
import { AnalyticsProvider } from "@/lib/analytics-provider";
import { siteConfig } from "@/lib/seo/config";
import { generateOrganizationSchema } from "@/lib/seo/config";

import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains",
	display: "swap",
});

const cinzel = Cinzel({
	subsets: ["latin"],
	variable: "--font-cinzel",
	display: "swap",
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "Cierre contable con evidencia fiscal antes de declarar | Arkelythex",
	description:
		"Arkelythex pre-valida facturación electrónica, SIRE e inconsistencias tributarias para estudios contables que no pueden permitirse declarar a ciegas.",
		keywords: [
		"Arkelythex",
		"software contable Perú",
		"inteligencia fiscal",
		"Drenyra contabilidad",
		"agentes IA contabilidad",
		"SUNAT",
		"facturación electrónica",
		"SIRE",
		"PLE",
		"API tributaria Perú",
	],
	metadataBase: new URL(siteConfig.url),
	alternates: {
		canonical: `${siteConfig.url}/`,
	},
	openGraph: {
		type: "website",
		locale: siteConfig.locale,
		url: `${siteConfig.url}/`,
		siteName: siteConfig.name,
		title: "Cierre contable con evidencia fiscal antes de declarar | Arkelythex",
		description:
			"Arkelythex pre-valida facturación electrónica, SIRE e inconsistencias tributarias para estudios contables que no pueden permitirse declarar a ciegas.",
		images: [
			{
				url: "/api/og?title=Arkelythex&subtitle=Infraestructura%20fiscal%20de%20%C3%A9lite%20para%20Per%C3%BA&accent=FAFAFA",
				width: 1200,
				height: 630,
				alt: "Arkelythex - Infraestructura fiscal de élite para Perú",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		site: siteConfig.twitterHandle,
		creator: siteConfig.twitterHandle,
		title: "Cierre contable con evidencia fiscal antes de declarar | Arkelythex",
		description:
			"Arkelythex pre-valida facturación electrónica, SIRE e inconsistencias tributarias para estudios contables que no pueden permitirse declarar a ciegas.",
		images: [
			"/api/og?title=Arkelythex&subtitle=Infraestructura%20fiscal%20de%20%C3%A9lite%20para%20Per%C3%BA&accent=FAFAFA",
		],
	},
	icons: {
		icon: "/brand/favicon.svg",
		apple: "/brand/favicon.svg",
	},
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	themeColor: "#0A0A0A",
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Generate sitewide Schema.org structured data. Product schemas are page-specific.

	return (
		<html lang="es">
			<head>
				{/* Schema.org JSON-LD for SEO */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(generateOrganizationSchema()),
					}}
				/>
				{/* Preload critical hero images for faster LCP */}
				<link
					rel="preload"
					href="/brand/home/hero.webp"
					as="image"
					type="image/webp"
				/>
				<link
					rel="preload"
					href="/brand/home/drenyra.webp"
					as="image"
					type="image/webp"
				/>
			</head>
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} ${cinzel.variable} font-sans text-base antialiased bg-background`}
			>
				{/* Skip to main content — WCAG 2.4.1 */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background focus:outline-none focus:ring-2 focus:ring-primary/50"
				>
					Saltar al contenido principal
				</a>

				<div className="landing-noise-overlay" aria-hidden />

				<AnalyticsProvider>
					{children}
					<PublicClientIslands />
				</AnalyticsProvider>
				<Analytics />
			</body>
		</html>
	);
}
