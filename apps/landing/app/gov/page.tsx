import type { Metadata } from "next";
import Link from "next/link";
import { Shield, FileCheck, Eye, Gavel, Clock, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/footer";
import { GOV_COPY } from "@/lib/landing/copy/gov";
import { generatePageMetadata, generateBreadcrumbSchema, siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: "Arkelythex Gov | Gobernanza y Compliance",
    description: "Gov es la capa de gobierno que falta en los sistemas contables peruanos. Acceso, cambios y trazabilidad sin brechas. Roadmap 2026.",
    path: "/gov",
  }),
  robots: { index: false, follow: true },
};

const govJsonLd = {
  "@context": "https://schema.org", "@type": "SoftwareApplication",
  name: "Arkelythex Gov", applicationCategory: "BusinessApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", availability: "https://schema.org/PreOrder" },
  publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
};

export default function GovPage() {
  return (
    <main id="main-content" className="relative min-h-screen bg-background text-foreground outline-none" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([govJsonLd, generateBreadcrumbSchema([{ name: "Inicio", url: siteConfig.url }, { name: "Gov", url: `${siteConfig.url}/gov` }])]) }} />
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
              {GOV_COPY.hero.headline}{" "}
              <span className="text-muted-foreground">{GOV_COPY.hero.headlineEmphasis}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{GOV_COPY.hero.subhead}</p>
            <Link href={GOV_COPY.hero.ctaHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-transparent px-6 py-3 text-sm font-semibold text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={GOV_COPY.hero.ctaLabel}>
              {GOV_COPY.hero.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </header>

          {/* ── Governance Layers (diagram) ──────────────── */}
          <section className="space-y-6" aria-label="Capas de gobernanza">
            <p className="landing-eyebrow">{GOV_COPY.vision.tagline}</p>
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">{GOV_COPY.vision.headline}</h2>
            <div className="relative mt-8">
              <svg className="pointer-events-none absolute left-5 top-0 h-full w-px" aria-hidden>
                <line x1="0" y1="12" x2="0" y2="calc(100% - 12px)" stroke="currentColor" strokeWidth="1" className="text-white/[0.06]" strokeDasharray="4 4" />
              </svg>
              <div className="ml-14 space-y-8">
                {GOV_COPY.vision.items.map((item, index) => {
                  const LAYER_ICONS = [Shield, FileCheck, Eye, Gavel] as const;
                  const LayerIcon = LAYER_ICONS[index];
                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground">
                        <LayerIcon className="h-3 w-3 text-background" aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Roadmap ──────────────────────────────────── */}
          <section className="space-y-6" aria-label="Hoja de ruta">
            <p className="landing-eyebrow">{GOV_COPY.roadmap.tagline}</p>
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">{GOV_COPY.roadmap.headline}</h2>
            <div className="space-y-0">
              {GOV_COPY.roadmap.milestones.map((ms, i) => (
                <div key={ms.quarter} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.06] bg-background">
                      <div className="h-2 w-2 rounded-full bg-foreground/60" />
                    </div>
                    {i < GOV_COPY.roadmap.milestones.length - 1 && <div className="h-10 w-px bg-white/[0.06]" />}
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
            <h2 className="text-2xl font-bold">{GOV_COPY.waitlistCta.headline}</h2>
            <p className="mt-2 text-muted-foreground">{GOV_COPY.waitlistCta.subhead}</p>
            <Link href={GOV_COPY.waitlistCta.mailto} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-transparent px-8 py-3 text-sm font-semibold text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={GOV_COPY.waitlistCta.ctaLabel}>
              {GOV_COPY.waitlistCta.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
