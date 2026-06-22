import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { PreciosPage } from "./precios-page";
import { preciosSchema, generateBreadcrumbSchema } from "@/lib/seo/config";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Precios | Arkelythex — Plataforma de Inteligencia Fiscal",
  description:
    "Planes diseñados para escalar con tu operación. Sin contratos inflexibles. Sin costos ocultos. Elige el plan que mejor se ajuste a tu volumen de operaciones.",
  alternates: {
    canonical: "/precios",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://arkelythexfounders.com/precios",
    siteName: "Arkelythex",
    title: "Precios | Arkelythex — Plataforma de Inteligencia Fiscal",
    description:
      "Planes diseñados para escalar con tu operación. Sin contratos inflexibles. Sin costos ocultos.",
    images: [
      {
        url: "/api/og?title=Precios&subtitle=Planes%20para%20escalar%20con%20tu%20operación&accent=FAFAFA",
        width: 1200,
        height: 630,
        alt: "Precios - Planes Arkelythex para PYMES Peruanas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@arkalythix",
    creator: "@arkalythix",
    title: "Precios | Arkelythex — Plataforma de Inteligencia Fiscal",
    description:
      "Planes diseñados para escalar con tu operación. Sin contratos inflexibles. Sin costos ocultos.",
    images: ["/api/og?title=Precios&subtitle=Planes%20para%20escalar%20con%20tu%20operación&accent=FAFAFA"],
  },
};

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Inicio", url: `${siteConfig.url}/` },
  { name: "Precios", url: `${siteConfig.url}/precios` },
]);

export default function PreciosRoute() {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background text-foreground theme-oled"
      tabIndex={-1}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(preciosSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />
      <PreciosPage />
      <Footer />
    </main>
  );
}