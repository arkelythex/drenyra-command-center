"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Monitor, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { DemoRequestForm } from "@/components/demo/demo-request-form";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { cn } from "@/lib/utils";
import { DEMO_COPY } from "@/lib/landing/copy/demo";
import { whatsappContactUrl } from "@/lib/whatsapp";

const STEP_ICONS: Record<number, typeof Calendar> = { 1: Calendar, 2: Monitor, 3: BarChart3 };

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }): ReactElement {
  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/[0.02]" aria-expanded={isOpen}>
        <span className="font-medium text-foreground">{question}</span>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} aria-hidden />
      </button>
      {isOpen && <div className="px-6 pb-4 pt-0"><p className="text-sm text-muted-foreground leading-relaxed">{answer}</p></div>}
    </div>
  );
}

export function DemoPage(): ReactElement {
  const { hero, process, trustBadges, faq, pricingCta } = DEMO_COPY;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <>
      <section aria-label="Solicitar demo" className="relative overflow-hidden px-6 py-28 md:py-40">
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
              <Link href={whatsappContactUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                {hero.ctaPrimary} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={hero.ctaSecondaryHref} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {hero.ctaSecondary}
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.25}>
            <DemoRequestForm />
          </ScrollReveal>
        </div>
      </section>

      <section aria-label="Proceso de demo" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10 text-center">
          <ScrollReveal><p className="landing-eyebrow">{process.tagline}</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">{process.headline}</h2></ScrollReveal>
          <div className="mt-12 flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
            {process.steps.map((step) => {
              const Icon = STEP_ICONS[step.number as keyof typeof STEP_ICONS];
              return (
                <div key={step.number} className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
                    {Icon ? <Icon className="h-6 w-6 text-muted-foreground" aria-hidden /> : <span className="text-xl font-bold text-muted-foreground">{step.number}</span>}
                  </div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.duration}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="Insignias de confianza" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal><p className="landing-eyebrow">{trustBadges.tagline}</p></ScrollReveal>
          <div className="mt-10 space-y-5">
            {trustBadges.items.map((item) => (
              <ScrollReveal key={item.title}>
                <div className="border-b landing-border pb-5">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Preguntas frecuentes" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal><p className="landing-eyebrow text-center">{faq.tagline}</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="mt-4 text-center text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">Preguntas frecuentes</h2></ScrollReveal>
          <div className="mt-10 space-y-3">
            {faq.items.map((item, i) => (
              <ScrollReveal key={item.question} delay={i * 0.06}>
                <FaqItem question={item.question} answer={item.answer} isOpen={openFaqIndex === i} onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Ver planes y precios" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-xl px-6 text-center">
          <ScrollReveal><p className="landing-eyebrow">{pricingCta.tagline}</p></ScrollReveal>
          <ScrollReveal delay={0.1}><h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">{pricingCta.headline}</h2></ScrollReveal>
          <ScrollReveal delay={0.15}><p className="mt-4 text-base leading-relaxed text-muted-foreground">{pricingCta.subhead}</p></ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Link href={pricingCta.ctaHref} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              {pricingCta.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
