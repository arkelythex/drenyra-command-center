"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const lineDraw = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/**
 * The Stack — architecture diagram section.
 * Palantir-style: lines, nodes, negative space. No cards, no icons.
 * Animated with framer-motion for staggered reveals.
 */
const STACK_COPY = {
  eyebrow: "La Plataforma",
  headline: "Una capa de infraestructura, múltiples superficies",
  subheadline:
    "Arkelythex Platform ejecuta reglas fiscales, evidencia, integraciones y agentes gobernados. Drenyra es la interfaz de comando. Los módulos son capacidades especializadas, no productos aislados.",
  layers: [
    {
      name: "Drenyra",
      role: "Aplicación Insignia",
      description:
        "Command center agéntico para empresas, periodos, expedientes, agentes, evidencia, riesgo y aprobación humana.",
    },
    {
      name: "Platform",
      role: "Motor de Cumplimiento",
      description:
        "APIs, integraciones SUNAT/OSE, compliance runtime, identidad, permisos y evidencia compartida.",
    },
    {
      name: "Ledger",
      role: "Operación Contable",
      description:
        "Facturación electrónica, conciliación bancaria, asientos auditables y trazabilidad de comprobantes.",
    },
    {
      name: "Studio",
      role: "Reportes y Dashboards",
      description:
        "Gestión multi-RUC, calendario tributario, monitoreo de riesgo y portal de clientes para estudios contables.",
    },
    {
      name: "Cortex",
      role: "Inteligencia Fiscal",
      description:
        "Riesgo priorizado, reglas versionadas, action queue y análisis antes del cierre mensual.",
    },
    {
      name: "Gov",
      role: "Gobernanza",
      description:
        "Permisos, políticas, aprobaciones y controles cross-module a escala.",
    },
    {
      name: "Grid",
      role: "Red de Datos",
      description:
        "Conectividad entre empresas, auditores y autoridades fiscales con trazabilidad completa.",
    },
  ],
} as const;

export function TheStack(): ReactElement {
  const { stack } = { stack: STACK_COPY };

  return (
    <section id="the-stack" className="relative py-32 md:py-40" aria-label="Stack tecnológico">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-20">
            <p className={`${LANDING_EYEBROW_CLASS} mb-4`}>
              {stack.eyebrow}
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground text-balance mb-6">
              {stack.headline}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {stack.subheadline}
            </p>
          </div>
        </ScrollReveal>

        {/* Architecture diagram */}
        <ScrollReveal>
          <motion.div
            className="relative mx-auto max-w-3xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Aevon — top layer */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
              <div className="relative border border-border bg-foreground/[0.04] px-8 py-6 text-center">
                {/* Accent line on top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px w-16 h-px bg-foreground/40" />
                <p className="text-xs font-medium tracking-[0.15em] uppercase text-section-label mb-1">
                  {stack.layers[0].role}
                </p>
                <p className="text-2xl font-semibold text-foreground tracking-tight">
                  {stack.layers[0].name}
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  {stack.layers[0].description}
                </p>
              </div>
            </motion.div>

            {/* Connecting line — top */}
            <div className="flex justify-center">
              <motion.div
                className="w-px h-8 bg-foreground/30 origin-top"
                variants={lineDraw}
                transition={{ duration: 0.4, delay: 0.6 }}
              />
            </div>

            {/* Core infrastructure — grid */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {stack.layers.slice(1).map((layer) => (
                <motion.div
                  key={layer.name}
                  variants={fadeInUp}
                  transition={{ duration: 0.4 }}
                  className="bg-background px-6 py-5 text-center group hover:bg-foreground/[0.04] transition-colors"
                >
                  <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-section-label mb-1">
                    {layer.role}
                  </p>
                  <p className="text-lg font-medium text-foreground tracking-tight">
                    {layer.name}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Connecting line — bottom */}
            <div className="flex justify-center">
              <motion.div
                className="w-px h-8 bg-foreground/30 origin-top"
                variants={lineDraw}
                transition={{ duration: 0.4, delay: 1 }}
              />
            </div>

            {/* Base label */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="text-center text-xs font-medium tracking-[0.2em] uppercase text-section-label"
            >
              Aplicaciones consumen esta infraestructura
            </motion.p>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
