"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Quote } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { CASOS_COPY } from "@/lib/landing/copy/casos-de-exito";
import { TYPOGRAPHY } from "@/lib/design-tokens";
import { PageErrorBoundary } from "@/components/ui/page-error-boundary";

function ProductBadges({ products }: { products: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {products.map((p) => (
        <span
          key={p}
          className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          {p}
        </span>
      ))}
    </div>
  );
}

function HeroMetricsLayout({ c }: { c: (typeof CASOS_COPY.cases)[number] }) {
  return (
    <section className="border-t landing-border py-16 md:py-24" aria-label={`Caso de éxito: ${c.industry}`}>
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
        <ScrollReveal>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{c.industry}</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span className="text-xs text-muted-foreground">{c.role}</span>
          </div>
          <ProductBadges products={c.products} />
        </ScrollReveal>

        {/* Large metric hero */}
        <ScrollReveal delay={0.1}>
          <div className="mt-10 grid grid-cols-3 gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8">
            {c.metrics.map((m) => (
              <div key={m.label} className="text-center">
                <span className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.04em] text-foreground">{m.value}</span>
                <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Narrative */}
        <ScrollReveal delay={0.15}>
          <div className="mt-10 grid gap-6 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="font-semibold text-foreground">Desafío</p>
              <p className="mt-2">{c.challenge}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Solución</p>
              <p className="mt-2">{c.solution}</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Quote */}
        <ScrollReveal delay={0.2}>
          <blockquote className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
            <Quote className="mt-0.5 h-5 w-5 shrink-0 text-white/20" aria-hidden />
            <div>
              <p className="text-sm italic text-muted-foreground">&ldquo;{c.quote}&rdquo;</p>
              <footer className="mt-2 text-xs text-muted-foreground">— {c.author}</footer>
            </div>
          </blockquote>
        </ScrollReveal>
      </div>
    </section>
  );
}

function SplitLayout({ c }: { c: (typeof CASOS_COPY.cases)[number] }) {
  return (
    <section className="border-t landing-border py-16 md:py-24" aria-label={`Caso de éxito: ${c.industry}`}>
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
        <ScrollReveal>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{c.industry}</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span className="text-xs text-muted-foreground">{c.role}</span>
          </div>
          <ProductBadges products={c.products} />
        </ScrollReveal>

        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          {/* Left: challenge + solution */}
          <ScrollReveal delay={0.1}>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desafío</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.challenge}</p>
              </div>
              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solución</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.solution}</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: metrics + results */}
          <ScrollReveal delay={0.15}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
              <div className="grid grid-cols-3 gap-4">
                {c.metrics.map((m) => (
                  <div key={m.label} className="text-center">
                    <span className="text-xl font-bold text-foreground">{m.value}</span>
                    <p className="mt-0.5 text-muted-foreground" style={{ fontSize: TYPOGRAPHY["2xs"] }}>{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-5">
                {c.results.map((r) => (
                  <div key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Quote */}
        <ScrollReveal delay={0.2}>
          <blockquote className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
            <Quote className="mt-0.5 h-5 w-5 shrink-0 text-white/20" aria-hidden />
            <div>
              <p className="text-sm italic text-muted-foreground">&ldquo;{c.quote}&rdquo;</p>
              <footer className="mt-2 text-xs text-muted-foreground">— {c.author}</footer>
            </div>
          </blockquote>
        </ScrollReveal>
      </div>
    </section>
  );
}

function NarrativeLayout({ c }: { c: (typeof CASOS_COPY.cases)[number] }) {
  return (
    <section className="border-t landing-border py-16 md:py-24" aria-label={`Caso de éxito: ${c.industry}`}>
      <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
        <ScrollReveal>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{c.industry}</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span className="text-xs text-muted-foreground">{c.role}</span>
          </div>
          <ProductBadges products={c.products} />
        </ScrollReveal>

        {/* Vertical story flow */}
        <ScrollReveal delay={0.1}>
          <div className="mt-10 space-y-8">
            <div className="relative pl-6 border-l-2 border-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desafío</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.challenge}</p>
            </div>
            <div className="relative pl-6 border-l-2 border-primary/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Solución</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.solution}</p>
            </div>
            <div className="relative pl-6 border-l-2 border-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultados</p>
              <div className="mt-3 grid grid-cols-3 gap-4">
                {c.metrics.map((m) => (
                  <div key={m.label}>
                    <span className="text-2xl font-bold text-foreground">{m.value}</span>
                    <p className="mt-0.5 text-muted-foreground" style={{ fontSize: TYPOGRAPHY["2xs"] }}>{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5">
                {c.results.map((r) => (
                  <div key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Quote */}
        <ScrollReveal delay={0.15}>
          <blockquote className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
            <Quote className="mt-0.5 h-5 w-5 shrink-0 text-white/20" aria-hidden />
            <div>
              <p className="text-sm italic text-muted-foreground">&ldquo;{c.quote}&rdquo;</p>
              <footer className="mt-2 text-xs text-muted-foreground">— {c.author}</footer>
            </div>
          </blockquote>
        </ScrollReveal>
      </div>
    </section>
  );
}

const LAYOUT_MAP = {
  "hero-metrics": HeroMetricsLayout,
  split: SplitLayout,
  narrative: NarrativeLayout,
} as const;

export function CasosDeExitoPage() {
  const { hero, disclaimer, cases, cta } = CASOS_COPY;

  return (
    <PageErrorBoundary pageName="Casos de Éxito">
    <>
      <section className="relative overflow-hidden px-6 py-28 md:py-40" aria-label="Casos de éxito">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)", backgroundSize: "40px 40px" }} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" aria-hidden />
        <MouseGlow className="z-[2]" opacity={0.04} size={700} blurRadius={160} />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> {hero.tagline}
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="mt-6 text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.1] tracking-tight">
              {hero.headline}{" "}<span className="text-muted-foreground">{hero.headlineEmphasis}</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{hero.subhead}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href={hero.ctaPrimaryHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                {hero.ctaPrimary} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={hero.ctaSecondaryHref} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
                {hero.ctaSecondary}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-t landing-border py-12" aria-label="Aviso legal">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <p className="text-xs leading-relaxed text-muted-foreground">{disclaimer.text}</p>
        </div>
      </section>

      {cases.map((c, i) => {
        const LayoutComponent = LAYOUT_MAP[c.layout];
        return <LayoutComponent key={c.industry + i} c={c} />;
      })}

      <section className="border-t landing-border py-24 md:py-32" aria-label="Comenzar ahora">
        <div className="mx-auto max-w-xl px-6 text-center">
          <ScrollReveal><p className="font-semibold text-primary">{cta.headline}</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">{cta.tagline}</h2></ScrollReveal>
          <ScrollReveal delay={0.15}><p className="mt-4 text-base leading-relaxed text-muted-foreground">{cta.description}</p></ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Link href={cta.href} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              {cta.cta} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
    </PageErrorBoundary>
  );
}
