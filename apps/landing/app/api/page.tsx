import type { Metadata } from "next";

import { ApiDocsShell } from "@/components/api/ApiDocsShell";
import { ApiPage } from "./api-page";
import { apiSchema, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
	title: "API | Infraestructura Tributaria para Equipos Técnicos - Arkelythex",
	description:
		"API pública de Arkelythex para el sistema tributario peruano. Infraestructura tipo Stripe: consulta RUC, valida comprobantes y genera PLE/SIRE. Pago por uso.",
	keywords: [
		"API Arkelythex",
		"API tributaria Perú",
		"API SUNAT",
		"consulta RUC API",
		"validación comprobantes",
		"API contable Perú",
		"API para desarrolladores Perú",
	],
	alternates: { canonical: "/api" },
	openGraph: {
		type: "website",
		locale: siteConfig.locale,
		url: `${siteConfig.url}/api`,
		siteName: siteConfig.name,
		title: "API | Infraestructura Tributaria para Equipos Técnicos - Arkelythex",
		description:
			"API pública de Arkelythex para consultar RUC, validar comprobantes y generar PLE/SIRE.",
		images: [
			{
				url: `${siteConfig.ogImage}?title=API&subtitle=Infraestructura%20tributaria%20para%20equipos%20t%C3%A9cnicos&accent=FAFAFA`,
				width: 1200,
				height: 630,
				alt: "API Arkelythex — Infraestructura tributaria para equipos técnicos",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "API Arkelythex | Infraestructura Tributaria",
		description:
			"Consulta RUC, valida comprobantes y genera PLE/SIRE con una API moderna.",
		images: [
			`${siteConfig.ogImage}?title=API&subtitle=Infraestructura%20tributaria%20para%20equipos%20t%C3%A9cnicos&accent=FAFAFA`,
		],
	},
};

/** API Docs: shell de documentación (sin navbar/footer marketing — igual que `/docs`). */
export default function ApiRoute() {
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(apiSchema) }}
			/>
			<ApiDocsShell>
				<ApiPage />
			</ApiDocsShell>
		</>
	);
}
