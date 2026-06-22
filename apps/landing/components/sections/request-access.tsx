"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/brand-home";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

/**
 * Request Access — CTA section.
 * Palantir-style: institutional, exclusive, single action.
 */
export function RequestAccess(): ReactElement {
  const { requestAccess } = BRAND_HOME_COPY;

  return (
    <section
      id="request-access"
      className="relative py-32 md:py-40"
      aria-label="Solicitar acceso"
    >
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10 text-center">
        <ScrollReveal>
          <p className={`${LANDING_EYEBROW_CLASS} mb-4`}>
            {requestAccess.eyebrow}
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground text-balance mb-6">
            {requestAccess.headline}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            {requestAccess.subheadline}
          </p>

          {/* CTA */}
          <Link
            href="/drenyra"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-foreground text-background text-sm font-medium tracking-wide hover:bg-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {requestAccess.cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>

          <p className="text-xs text-muted-foreground mt-6">
            {requestAccess.note}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-foreground/50" aria-hidden />
              250+ empresas en la plataforma
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-foreground/50" aria-hidden />
              15M+ comprobantes procesados
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-foreground/50" aria-hidden />
              99.9% uptime operacional
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
