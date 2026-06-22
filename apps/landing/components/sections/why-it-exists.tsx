"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/brand-home";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

/**
 * Why It Exists — continental problems section.
 * Editorial style: large stats, minimal design, institutional tone.
 */
export function WhyItExists(): ReactElement {
  const { whyItExists } = BRAND_HOME_COPY;
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section
      id="why-it-exists"
      className="scroll-mt-28 relative py-32 md:py-40 bg-foreground/[0.03]"
      aria-label="Problemas continentales que requieren infraestructura"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-20">
            <p className={`${LANDING_EYEBROW_CLASS} mb-4`}>
              {whyItExists.eyebrow}
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground text-balance">
              {whyItExists.headline}
            </h2>
          </div>
        </ScrollReveal>

        {/* Problems list — editorial, alternating backgrounds */}
        <div className="space-y-0 divide-y divide-white/[0.06]">
          {whyItExists.problems.map((problem, i) => (
            <ScrollReveal key={problem.title}>
              <div className={`grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 py-12 md:py-16 ${i % 2 === 0 ? "" : "bg-white/[0.005] -mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"}`}>
                {/* Left: stat + title */}
                <div>
                  <p className="text-[clamp(3rem,8vw,6rem)] font-bold text-foreground leading-none tracking-tighter mb-2">
                    {problem.stat}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {problem.context}
                  </p>
                </div>

                {/* Right: description */}
                <div className="flex items-center">
                  <div>
                    <p className="text-lg font-medium text-foreground mb-3">
                      {problem.title}
                    </p>
                    <div>
                      <p className={`text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg ${expanded !== i ? "line-clamp-3" : ""}`}>
                        {problem.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        className="mt-1 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                        aria-expanded={expanded === i}
                      >
                        {expanded === i ? "Mostrar menos" : "Leer más"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
