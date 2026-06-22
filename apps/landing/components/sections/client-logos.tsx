"use client";

import type { ReactElement } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

const CLIENT_LOGOS = [
  { name: "Grupo Norte", initials: "GN", industry: "Manufactura", shape: "rect" as const },
  { name: "Inversiones Andinas", initials: "IA", industry: "Inversiones", shape: "circle" as const },
  { name: "TechPerú", initials: "TP", industry: "Technology", shape: "hexagon" as const },
  { name: "Logística Express", initials: "LE", industry: "Logística", shape: "diamond" as const },
  { name: "Constructora Lima", initials: "CL", industry: "Construcción", shape: "rect" as const },
  { name: "Agrícola del Sur", initials: "AS", industry: "Agricultura", shape: "circle" as const },
] as const;

function MonogramMark({
  initials,
  shape,
  size = 40,
}: {
  initials: string;
  shape: "rect" | "circle" | "hexagon" | "diamond";
  size?: number;
}): ReactElement {
  const half = size / 2;
  const sixth = size / 6;

  const clipPath = {
    rect: `M0,0 h${size} v${size} h-${size}z`,
    circle: `M${half},0 a${half},${half} 0 1,1 0,${size} a${half},${half} 0 1,1 0,-${size}z`,
    hexagon: `M${half},0 l${half * 0.866},${half * 0.5} v${half} l-${half * 0.866},${half * 0.5} l-${half * 0.866},-${half * 0.5} v-${half}z`,
    diamond: `M${half},0 l${half},${half} l-${half},${half} l-${half},-${half}z`,
  }[shape];

  const paths = [
    { d: clipPath, className: "fill-foreground/[0.06] stroke-foreground/10 transition-colors group-hover:fill-foreground/[0.1]" },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      className="text-muted-foreground transition-colors group-hover:text-foreground"
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} className={p.className} />
      ))}
      <text
        x={half}
        y={half + 1}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-current text-[13px] font-semibold tracking-[-0.02em]"
      >
        {initials}
      </text>
    </svg>
  );
}

export function ClientLogos(): ReactElement {
  return (
    <section
      id="clientes"
      className="scroll-mt-28 py-12 md:py-16"
      aria-label="Empresas que confían en Arkelythex"
    >
      <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-10">
        <ScrollReveal>
          <p className={`${LANDING_EYEBROW_CLASS} mb-8 text-center`}>
            Empresas que ya operan con Arkelythex
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-6">
          {CLIENT_LOGOS.map((logo, index) => (
            <ScrollReveal key={logo.name} delay={index * 0.05} direction="up">
              <div className="group flex flex-col items-center text-center">
                <MonogramMark initials={logo.initials} shape={logo.shape} />
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {logo.name}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={0.3}>
          <p className="mt-10 text-center text-[11px] text-muted-foreground/50">
            Empresas representativas
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
