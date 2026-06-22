import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { DrenyraTerminalPreview } from "@/components/drenyra/drenyra-terminal-preview";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo/config";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Terminal Drenyra | Arkelythex",
  description: "Terminal CLI de Drenyra: orquestación fiscal, consultas en vivo y automatizaciones con compuertas de aprobación humana.",
  alternates: { canonical: "/drenyra/terminal" },
  openGraph: {
    type: "website", locale: "es_PE",
    url: `${siteConfig.url}/drenyra/terminal`, siteName: "Arkelythex",
    title: "Terminal Drenyra | Arkelythex",
    description: "CLI fiscal en vivo con subagentes, trazabilidad y compuertas de aprobación humana.",
    images: [{ url: "/api/og?title=Terminal%20Drenyra&subtitle=Fiscal%20CLI&accent=FAFAFA", width: 1200, height: 630, alt: "Terminal Drenyra" }],
  },
  twitter: {
    card: "summary_large_image", site: "@arkalythix", creator: "@arkalythix",
    title: "Terminal Drenyra | Arkelythex",
    description: "CLI fiscal con subagentes, trazabilidad y compuertas de aprobación humana.",
    images: ["/api/og?title=Terminal%20Drenyra&subtitle=Fiscal%20CLI&accent=FAFAFA"],
  },
};

const terminalSchema = generateProductSchema({
  name: "Arkelythex Terminal Drenyra",
  description: "Terminal CLI de Drenyra para orquestación fiscal.",
  price: "Incluido en Drenyra",
  category: "DeveloperApplication",
  features: ["Orquestación multi-agente desde CLI", "Trazabilidad con TraceId", "Compuertas de aprobación humana", "Consultas en vivo de estado fiscal"],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Inicio", url: `${siteConfig.url}/` },
  { name: "Drenyra", url: `${siteConfig.url}/drenyra` },
  { name: "Terminal", url: `${siteConfig.url}/drenyra/terminal` },
]);

export default function DrenyraTerminalRoute() {
  return (
    <main id="main-content" className="relative min-h-screen bg-background text-foreground outline-none theme-oled" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(terminalSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-28 md:max-w-5xl md:px-10 md:py-40">
        <Link href="/drenyra" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a Drenyra
        </Link>

        <p className="landing-eyebrow">Fiscal CLI</p>
        <h1 className="mt-4 text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.1] tracking-tight">Terminal Drenyra</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Orquestá flujos fiscales, consultá en vivo y automatizá tareas desde la terminal. Con subagentes, trazabilidad y compuertas de aprobación humana.
        </p>

        <div className="mt-12"><DrenyraTerminalPreview /></div>

        <div className="mt-16 space-y-5">
          {[
            { title: "Orquestación", desc: "Coordiná múltiples subagentes fiscales en un solo comando, paralelos o secuenciales según el flujo." },
            { title: "Trazabilidad", desc: "Cada acción deja evidencia con TraceId, bitácora exportable y referencia temporal para auditoría." },
            { title: "Compuertas", desc: "Acciones sensibles requieren aprobación humana antes de ejecutarse — sin perder velocidad operativa." },
          ].map((item) => (
            <div key={item.title} className="border-b landing-border pb-5">
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
