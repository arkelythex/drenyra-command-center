"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

/**
 * Applications — vertical solutions grid.
 * Minimal, institutional. Each vertical gets a line, not a card.
 */
const APPLICATIONS_COPY = {
  eyebrow: "Lo Que Construimos",
  headline: "Capacidades especializadas bajo una misma plataforma",
  subheadline:
    "Cada desafío fiscal peruano tiene una respuesta dentro del ecosistema Arkelythex. Sin herramientas dispersas, sin retrabajo, sin sorpresas.",
  items: [
    {
      name: "Drenyra",
      domain: "Command Center Fiscal",
      description:
        "Agente central que orquesta agentes especializados, evidencia y aprobación humana.",
      href: "/drenyra",
      status: "active" as const,
    },
    {
      name: "Facturación Electrónica",
      domain: "CPE y validación UBL",
      description:
        "Emisión, validación y seguimiento de comprobantes con evidencia completa.",
      href: "/drenyra#drenyra-modulos",
      status: "active" as const,
    },
    {
      name: "Conciliación Bancaria",
      domain: "Cruce automático",
      description:
        "Detección de diferencias antes de declarar con conciliación asistida por IA.",
      href: "/drenyra#drenyra-modulos",
      status: "active" as const,
    },
    {
      name: "Motor Tributario",
      domain: "IGV y retenciones",
      description:
        "Reglas de IGV, retenciones y controles de consistencia por periodo.",
      href: "/drenyra#drenyra-modulos",
      status: "active" as const,
    },
    {
      name: "SIRE y Registros",
      domain: "RVIE/RCE",
      description:
        "Preparación y seguimiento de registros SUNAT con evidencia audit-ready.",
      href: "/drenyra#drenyra-sire",
      status: "active" as const,
    },
    {
      name: "Expedientes Fiscales",
      domain: "Trazabilidad",
      description:
        "Evidencia por periodo con trazabilidad completa de decisiones.",
      href: "/drenyra#drenyra-modulos",
      status: "active" as const,
    },
    {
      name: "Análisis de Riesgo",
      domain: "Priorización IA",
      description:
        "Alertas priorizadas por impacto para actuar antes de declarar.",
      href: "/drenyra#drenyra-agentes",
      status: "active" as const,
    },
    {
      name: "Multi-RUC",
      domain: "Gestión de cartera",
      description:
        "Operación multi-RUC para estudios contables con visibilidad compartida.",
      href: "/drenyra#drenyra-modulos",
      status: "active" as const,
    },
  ],
} as const;

export function Applications(): ReactElement {
  const { applications } = { applications: APPLICATIONS_COPY };

  return (
    <section
      id="applications"
      className="relative py-32 md:py-40 bg-white/[0.005]"
      aria-label="Capacidades integradas de Arkelythex"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-20">
            <p className={`${LANDING_EYEBROW_CLASS} mb-4`}>
              {applications.eyebrow}
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground text-balance mb-6">
              {applications.headline}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {applications.subheadline}
            </p>
          </div>
        </ScrollReveal>

        {/* Applications list — rows, not cards */}
        <ScrollReveal>
          <div className="divide-y divide-border border-t border-border-strong">
            {applications.items.map((app) => (
              <Link
                key={app.name}
                href={app.href}
                className="group flex items-center justify-between py-6 md:py-8 transition-colors hover:bg-white/[0.02] px-4 -mx-4 oled-spotlight-border focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-1">
                    <p className="text-xl md:text-2xl font-semibold text-foreground tracking-tight group-hover:text-muted-foreground transition-colors">
                      {app.name}
                    </p>
                    <span className="text-xs font-medium tracking-[0.1em] uppercase text-section-label">
                      {app.domain}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    {app.description}
                  </p>
                </div>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors ml-4" aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M7 4l6 6-6 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
