"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Award, FileCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { SeguridadArchDiagram } from "@/components/seguridad/seguridad-arch-diagram";
import { SEGURIDAD_COPY } from "@/lib/landing/copy/seguridad";
import { PageErrorBoundary } from "@/components/ui/page-error-boundary";

const { hero, pillars, architecture, certBadges, trustCta } = SEGURIDAD_COPY;

const SEGURIDAD_FAQ = [
  {
    question: "¿Qué certificaciones tiene Arkelythex?",
    answer: "Certificaciones ISO 27001 y SOC 2 Type II, con auditorías anuales independientes. Cumplimiento total con la Ley 29733 de protección de datos personales del Perú.",
  },
  {
    question: "¿Mis datos fiscales están seguros?",
    answer: "Sí. Aislamiento estricto por tenant, encriptación en reposo y tránsito, y registros inmutables de auditoría. Tus datos nunca se mezclan con los de otros clientes.",
  },
  {
    question: "¿Qué protocolos de acceso tienen?",
    answer: "MFA obligatorio, roles granulares, IP allowlisting opcional, y logs de actividad completa. Cada acceso queda registrado con contexto completo.",
  },
  {
    question: "¿Soportan ambientes de staging/producción?",
    answer: "Sí. Entornos separados con datos sintéticos para testing. Los datos de producción nunca se exponen a staging.",
  },
];

export function SeguridadPage() {
  return (
    <PageErrorBoundary pageName="Seguridad">
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section aria-label="Seguridad y cumplimiento" className="relative overflow-hidden px-6 py-28 md:py-40">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" aria-hidden />
        <MouseGlow className="z-[2]" opacity={0.04} size={700} blurRadius={160} />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-xs font-medium text-muted-foreground">
              {hero.tagline}
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="mt-6 text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.1] tracking-tight">
              {hero.headline}{" "}
              <span className="text-foreground/80">{hero.headlineEmphasis}</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {hero.subhead}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href={hero.ctaPrimaryHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                {hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {hero.ctaSecondaryHref && (
                <Link
                  href={hero.ctaSecondaryHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border landing-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--color-border)]/5"
                >
                  {hero.ctaSecondary}
                </Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Architecture diagram (centerpiece) ───────────── */}
      <section aria-label="Diagrama de arquitectura de seguridad" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal>
            <p className="landing-eyebrow text-center">{architecture.tagline}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-4 text-center text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-balance">
              {architecture.headline}
            </h2>
          </ScrollReveal>
          <div className="mt-12">
            <SeguridadArchDiagram />
          </div>
        </div>
      </section>

      {/* ── Pillars (editorial list, not cards) ───────────── */}
      <section aria-label="Pilares de seguridad" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal>
            <p className="landing-eyebrow">{pillars.tagline}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-foreground">
              {pillars.headline}
            </h2>
          </ScrollReveal>
          <div className="mt-10 space-y-5">
            {pillars.items.map((item, i) => (
              <ScrollReveal key={item.key} delay={i * 0.08}>
                <div className="border-b landing-border pb-5">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications ───────────────────────────────── */}
      <section aria-label="Certificaciones" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal>
            <p className="landing-eyebrow">{certBadges.tagline}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-foreground">
              {certBadges.headline}
            </h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {certBadges.items.map((item, i) => {
              const icons = [ShieldCheck, Award, FileCheck];
              const Icon = icons[i % icons.length];
              return (
                <ScrollReveal key={item.title} delay={i * 0.08}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust CTA ────────────────────────────────────── */}
      <section aria-label="Solicitar demo de seguridad" id="demo" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <ScrollReveal>
            <p className="landing-eyebrow">{trustCta.tagline}</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-foreground text-balance">
              {trustCta.headline}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <Link
              href={trustCta.ctaHref}
              className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {trustCta.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section aria-label="Preguntas frecuentes de seguridad" id="seguridad-faq" className="border-t landing-border py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <ScrollReveal>
            <p className="landing-eyebrow text-center">Preguntas frecuentes</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-4 text-center text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight">
              Todo lo que necesitás saber sobre seguridad
            </h2>
          </ScrollReveal>
          <div className="mt-10 space-y-2">
            {SEGURIDAD_FAQ.map((item, i) => (
              <ScrollReveal key={item.question} delay={i * 0.05}>
                <details className="group rounded-xl border border-white/[0.06] bg-white/[0.01]">
                  <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.02]">
                    {item.question}
                    <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
    </PageErrorBoundary>
  );
}
