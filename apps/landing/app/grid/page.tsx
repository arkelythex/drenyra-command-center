import type { Metadata } from "next";
import Link from "next/link";
import { Network, Share2, Zap, Lock, Clock, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { GRID_COPY } from "@/lib/landing/copy/grid";
import { generatePageMetadata, generateBreadcrumbSchema, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: "Arkelythex Grid | Red de Datos entre Empresas",
    description: "Grid es la capa de datos que conecta los módulos de Arkelythex. API bridge, cache inteligente y pipelines. Roadmap 2026.",
    path: "/grid",
  }),
  robots: { index: false, follow: true },
};

const gridJsonLd = {
  "@context": "https://schema.org", "@type": "SoftwareApplication",
  name: "Arkelythex Grid", applicationCategory: "BusinessApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", availability: "https://schema.org/PreOrder" },
  publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
};

export default function GridPage() {
  return (
    <main id="main-content" className="relative min-h-screen bg-background text-foreground outline-none" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([gridJsonLd, generateBreadcrumbSchema([{ name: "Inicio", url: siteConfig.url }, { name: "Grid", url: `${siteConfig.url}/grid` }])]) }} />
      <Navbar />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)", backgroundSize: "40px 40px" }} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" aria-hidden />

        <div className="relative mx-auto max-w-4xl space-y-24 px-6 pb-24 pt-28 md:space-y-32 md:pb-32 md:pt-40">

          {/* ── Hero ─────────────────────────────────────── */}
          <header className="text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-sm font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              En desarrollo · Roadmap 2026
            </span>
            <h1 className="text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.1] tracking-tight">
              {GRID_COPY.hero.headline}{" "}
              <span className="text-muted-foreground">{GRID_COPY.hero.headlineEmphasis}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{GRID_COPY.hero.subhead}</p>
            <Link href={GRID_COPY.hero.ctaHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-transparent px-6 py-3 text-sm font-semibold text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={GRID_COPY.hero.ctaLabel}>
              {GRID_COPY.hero.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </header>

          {/* ── Data Pipeline (diagram) ──────────────────── */}
          <section className="space-y-6" aria-label="Pipeline de datos">
            <p className="landing-eyebrow">{GRID_COPY.vision.tagline}</p>
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">{GRID_COPY.vision.headline}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GRID_COPY.vision.items.map((item, i) => {
                const PIPELINE_ICONS = [Network, Share2, Zap, Lock] as const;
                const StepIcon = PIPELINE_ICONS[i];
                return (
                  <div key={item.title} className="relative">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <StepIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
                      </div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                    {i < 3 && (
                      <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-3 lg:block">
                        <ArrowRight className="h-4 w-4 text-white/[0.06]" aria-hidden />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Roadmap ──────────────────────────────────── */}
          <section className="space-y-6" aria-label="Hoja de ruta">
            <p className="landing-eyebrow">{GRID_COPY.roadmap.tagline}</p>
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">{GRID_COPY.roadmap.headline}</h2>
            <div className="space-y-0">
              {GRID_COPY.roadmap.milestones.map((ms, i) => (
                <div key={ms.quarter} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.06] bg-background">
                      <div className="h-2 w-2 rounded-full bg-foreground/60" />
                    </div>
                    {i < GRID_COPY.roadmap.milestones.length - 1 && <div className="h-10 w-px bg-white/[0.06]" />}
                  </div>
                  <div className="pb-8 pt-0.5">
                    <p className="text-sm font-semibold text-muted-foreground">{ms.quarter}</p>
                    <h3 className="text-base font-semibold">{ms.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ms.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Waitlist ─────────────────────────────────── */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 text-center" aria-label="Lista de espera">
            <h2 className="text-2xl font-bold">{GRID_COPY.waitlistCta.headline}</h2>
            <p className="mt-2 text-muted-foreground">{GRID_COPY.waitlistCta.subhead}</p>
            <Link href={GRID_COPY.waitlistCta.mailto} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-transparent px-8 py-3 text-sm font-semibold text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={GRID_COPY.waitlistCta.ctaLabel}>
              {GRID_COPY.waitlistCta.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
