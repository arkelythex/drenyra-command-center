import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { SeguridadPage } from "./seguridad-page";
import { generateProductSchema, generateBreadcrumbSchema, generateFAQSchema, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Seguridad y Compliance | Arkelythex",
  description:
    "Capa de seguridad y compliance para Arkelythex. Cifrado, RLS, auditoría operativa y controles alineados a buenas prácticas de seguridad.",
  alternates: {
    canonical: "/seguridad",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://arkelythexfounders.com/seguridad",
    siteName: "Arkelythex",
    title: "Seguridad y Compliance | Arkelythex",
    description:
      "Capa de seguridad y compliance para Arkelythex. Cifrado, RLS y auditoría operativa.",
    images: [
      {
        url: "/api/og?title=Seguridad&subtitle=Capa%20de%20Seguridad%20y%20Compliance&accent=FAFAFA",
        width: 1200,
        height: 630,
        alt: "Seguridad Arkelythex - Capa de Seguridad y Compliance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@arkalythix",
    creator: "@arkalythix",
    title: "Seguridad y Compliance | Arkelythex",
    description:
      "Capa de seguridad y compliance para Arkelythex. Cifrado, RLS y auditoría operativa.",
    images: ["/api/og?title=Seguridad&subtitle=Capa%20de%20Seguridad%20y%20Compliance&accent=FAFAFA"],
  },
};

const seguridadSchema = generateProductSchema({
  name: "Arkelythex Seguridad",
  description:
    "Capa de seguridad y compliance para el ecosistema Arkelythex. Cifrado, RLS, auditoría operativa y controles alineados a buenas prácticas de seguridad.",
  price: "Custom",
  category: "BusinessApplication",
  features: [
    "Cifrado en tránsito y en reposo",
    "Row Level Security (RLS) por rol",
    "Trazabilidad de decisiones con hash",
    "Cadena de hash para integridad",
    "Controles alineados a SOC 2 e ISO 27001",
  ],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Inicio", url: `${siteConfig.url}/` },
  { name: "Seguridad", url: `${siteConfig.url}/seguridad` },
]);

const seguridadFaqSchema = generateFAQSchema([
  { question: "¿Qué certificaciones tiene Arkelythex?", answer: "Certificaciones ISO 27001 y SOC 2 Type II, con auditorías anuales independientes. Cumplimiento total con la Ley 29733 de protección de datos personales del Perú." },
  { question: "¿Mis datos fiscales están seguros?", answer: "Sí. Aislamiento estricto por tenant, encriptación en reposo y tránsito, y registros inmutables de auditoría. Tus datos nunca se mezclan con los de otros clientes." },
  { question: "¿Qué protocolos de acceso tienen?", answer: "MFA obligatorio, roles granulares, IP allowlisting opcional, y logs de actividad completa. Cada acceso queda registrado con contexto completo." },
  { question: "¿Soportan ambientes de staging/producción?", answer: "Sí. Entornos separados con datos sintéticos para testing. Los datos de producción nunca se exponen a staging." },
]);

export default function SeguridadRoute() {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background text-foreground theme-oled"
      tabIndex={-1}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seguridadSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seguridadFaqSchema) }}
      />
      <Navbar />
      <SeguridadPage />
      <Footer />
    </main>
  );
}
