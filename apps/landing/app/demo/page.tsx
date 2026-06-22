import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { DemoPage } from "./demo-page";
import { generateProductSchema, generateBreadcrumbSchema, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Solicita una demo de Arkelythex | Drenyra en acción",
  description:
    "Agenda una sesión de demo personalizada de 30 minutos. Sin compromiso, sin costo. Mostramos Arkelythex con tus tipos de documento y reglas SUNAT vigentes.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://arkelythexfounders.com/demo",
    siteName: "Arkelythex",
    title: "Solicita una demo de Arkelythex | Drenyra en acción",
    description:
      "Agenda una sesión de demo personalizada de 30 minutos. Sin compromiso, sin costo.",
    images: [
      {
        url: "/api/og?title=Demo&subtitle=Sesi%C3%B3n%20personalizada%20de%2030%20minutos&accent=FAFAFA",
        width: 1200,
        height: 630,
        alt: "Demo Arkelythex - Sesión personalizada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@arkalythix",
    creator: "@arkalythix",
    title: "Solicita una demo de Arkelythex | Drenyra en acción",
    description:
      "Agenda una sesión de demo personalizada de 30 minutos. Sin compromiso, sin costo.",
    images: ["/api/og?title=Demo&subtitle=Sesi%C3%B3n%20personalizada%20de%2030%20minutos&accent=FAFAFA"],
  },
};

const demoSchema = generateProductSchema({
  name: "Arkelythex Demo",
  description:
    "Sesión de demo personalizada de 30 minutos para conocer Arkelythex con datos reales de tu operación. Sin compromiso, sin costo.",
  price: "0.00",
  priceCurrency: "PEN",
  category: "BusinessApplication",
  features: [
    "Demo personalizada de 30 minutos",
    "Configuración con tus tipos de documento",
    "Validación con reglas SUNAT vigentes",
    "Sin compromiso ni costo inicial",
    "Propuesta comercial al final de la sesión",
  ],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Inicio", url: `${siteConfig.url}/` },
  { name: "Demo", url: `${siteConfig.url}/demo` },
]);

export default function DemoRoute() {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background text-foreground theme-oled"
      tabIndex={-1}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(demoSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />
      <DemoPage />
      <Footer />
    </main>
  );
}
