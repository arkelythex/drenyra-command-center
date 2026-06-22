import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { CasosDeExitoPage } from "./casos-de-exito-page";
import { casosSchema, generateBreadcrumbSchema, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Casos de Éxito | Arkelythex",
  description:
    "Casos ilustrativos de uso de Arkelythex para estudios contables, retail y fintech que necesitan operar con control, evidencia y confianza.",
  alternates: {
    canonical: "/casos-de-exito",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: `${siteConfig.url}/casos-de-exito`,
    siteName: "Arkelythex",
    title: "Casos de Éxito | Arkelythex",
    description:
      "Casos ilustrativos de operación con Arkelythex para estudios contables, retail y fintech.",
    images: [
      {
        url: "/api/og?title=Casos%20de%20%C3%89xito&subtitle=Empresas%20que%20ya%20operan%20con%20control%20y%20confianza&accent=FAFAFA",
        width: 1200,
        height: 630,
        alt: "Casos ilustrativos - Arkelythex",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@arkalythix",
    creator: "@arkalythix",
    title: "Casos de Éxito | Arkelythex",
    description:
      "Casos ilustrativos de operación con Arkelythex para control, evidencia y confianza.",
    images: ["/api/og?title=Casos%20de%20%C3%89xito&subtitle=Empresas%20que%20ya%20operan%20con%20control%20y%20confianza&accent=FAFAFA"],
  },
};

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Inicio", url: `${siteConfig.url}/` },
  { name: "Casos de Éxito", url: `${siteConfig.url}/casos-de-exito` },
]);

export default function CasosDeExitoRoute() {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background text-foreground theme-oled"
      tabIndex={-1}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(casosSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />
      <CasosDeExitoPage />
      <Footer />
    </main>
  );
}