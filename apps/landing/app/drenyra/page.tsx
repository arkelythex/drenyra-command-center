import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { DrenyraPage } from "./drenyra-page";
import { generateProductSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo/config";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Drenyra | Plataforma Integral de Contabilidad Inteligente - Arkelythex",
  description:
    "Drenyra centraliza facturación, conciliación, análisis fiscal y SIRE en una sola plataforma con agentes IA que trabajan 24/7. Cada decisión deja evidencia auditable.",
  alternates: { canonical: "/drenyra" },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://arkelythexfounders.com/drenyra",
    siteName: "Arkelythex",
    title: "Drenyra | Plataforma Integral de Contabilidad Inteligente",
    description: "Facturación, conciliación, análisis fiscal y SIRE en una sola plataforma con agentes IA 24/7.",
    images: [{ url: "/api/og?title=Drenyra&subtitle=Plataforma%20Integral%20de%20Contabilidad%20Inteligente&accent=FAFAFA", width: 1200, height: 630, alt: "Drenyra - Plataforma Integral de Contabilidad Inteligente" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@arkalythix",
    creator: "@arkalythix",
    title: "Drenyra | Plataforma Integral de Contabilidad Inteligente",
    description: "Facturación, conciliación, análisis fiscal y SIRE en una sola plataforma con agentes IA 24/7.",
    images: ["/api/og?title=Drenyra&subtitle=Plataforma%20Integral%20de%20Contabilidad%20Inteligente&accent=FAFAFA"],
  },
};

const drenyraSchema = generateProductSchema({
  name: "Arkelythex Drenyra",
  description: "Plataforma integral de contabilidad inteligente de Arkelythex para Perú y LATAM.",
  price: "Custom",
  category: "BusinessApplication",
  features: ["Contabilidad operativa", "Gestión de estudios", "Análisis fiscal", "SIRE + facturación", "8 agentes IA"],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Inicio", url: `${siteConfig.url}/` },
  { name: "Drenyra", url: `${siteConfig.url}/drenyra` },
]);

const drenyraFaqSchema = generateFAQSchema([
  { question: "¿Qué es Drenyra exactamente?", answer: "Drenyra es una plataforma integral de contabilidad inteligente. Centraliza facturación, conciliación, análisis fiscal y SIRE en una sola interfaz, con agentes IA que trabajan 24/7." },
  { question: "¿Qué agentes tiene Drenyra?", answer: "8 agentes especializados: Bookkeeping, Finance, Reporting, SIRE, Compliance, Reconciliation, Document y Analytics. Cada uno está entrenado para una tarea específica del proceso contable y fiscal." },
  { question: "¿Necesito conocimientos de SUNAT para usarlo?", answer: "No. Drenyra abstrae la complejidad tributaria. Los agentes manejan validaciones, reglas y formatos automáticamente. Vos revisás y aprobás." },
  { question: "¿Drenyra reemplaza a mi contador?", answer: "No. Drenyra potencia al equipo contable. Automatiza tareas repetitivas y da evidencia, pero la decisión y supervisión humana siempre es obligatoria." },
  { question: "¿Puedo empezar con una parte y escalar después?", answer: "Sí. Podés empezar con SIRE o facturación y expandirte a conciliación, análisis y agentes IA adicionales cuando estés listo." },
]);

export default function DrenyraRoute() {
  return (
    <main id="main-content" className="relative min-h-screen bg-background text-foreground outline-none theme-oled" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(drenyraSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(drenyraFaqSchema) }} />
      <Navbar />
      <DrenyraPage />
      <Footer />
    </main>
  );
}
