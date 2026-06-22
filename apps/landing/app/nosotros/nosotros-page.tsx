"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { NOSOTROS_COPY } from "@/lib/landing/copy/nosotros";
import { PageErrorBoundary } from "@/components/ui/page-error-boundary";

export function NosotrosPage() {
  const { hero, mission, values, timeline, contact, cta } = NOSOTROS_COPY;

  return (
    <PageErrorBoundary pageName="Nosotros">
    <>
      <section aria-label="Sobre nosotros" className="relative overflow-hidden px-6 py-28 md:py-40">
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
              {hero.headline}{" "}<span className="text-foreground/80">{hero.headlineEmphasis}</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{hero.subhead}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href={hero.ctaPrimaryHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                {hero.ctaPrimary} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={hero.ctaSecondaryHref} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {hero.ctaSecondary}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section aria-label="Misión y visión" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <div className="grid gap-12 sm:grid-cols-2">
            <ScrollReveal>
              <p className="landing-eyebrow">Misión</p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{mission.statement}</p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="landing-eyebrow">Visión</p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{mission.vision}</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section aria-label="Valores" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal><p className="landing-eyebrow">Valores</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">Lo que nos define</h2></ScrollReveal>
          <div className="mt-10 space-y-5">
            {values.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.06}>
                <div className="border-b landing-border pb-5">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Nuestra historia" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal><p className="landing-eyebrow">Nuestra historia</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">De la idea al producto</h2></ScrollReveal>
          <div className="mt-10 relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.06]" aria-hidden />
            <div className="space-y-10">
              {timeline.map((item, i) => (
                <ScrollReveal key={item.year} delay={i * 0.1}>
                  <div className="relative flex gap-6 pl-10">
                    {/* Dot */}
                    <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" aria-hidden />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.year}</span>
                      <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Contacto" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-xl px-6 sm:px-8 lg:px-10 text-center">
          <ScrollReveal><p className="landing-eyebrow">{contact.tagline}</p></ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mt-4 space-y-2">
              {contact.email && <p className="text-muted-foreground">{contact.email}</p>}
              {contact.location && <p className="text-sm text-muted-foreground">{contact.location}</p>}
              {contact.social && (
                <div className="mt-4 flex justify-center gap-4">
                  {contact.social.map((s) => (
                    <a key={s.platform} href={s.url} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{s.handle}</a>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section aria-label="Llamada a la acción" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-xl px-6 text-center">
          <ScrollReveal>
            <p className="font-semibold text-primary">{cta.headline}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{cta.description}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <Link href={cta.href} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              {cta.cta} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
    </PageErrorBoundary>
  );
}
