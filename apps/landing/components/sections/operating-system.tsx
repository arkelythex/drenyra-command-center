"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const lineDraw = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

/**
 * Operating System — node diagram section.
 * Actors → Aevon → Infrastructure. Animated with framer-motion.
 */
const OS_COPY = {
  eyebrow: "Ecosistema",
  headline: "Infraestructura que conecta a todos los actores fiscales",
  subheadline:
    "Empresas, estudios contables, bancos, auditores y ciudadanos — todos conectados a través de una capa unificada de inteligencia fiscal.",
  actors: [
    { name: "Empresas", icon: "briefcase" as const },
    { name: "Estudios", icon: "building" as const },
    { name: "Bancos", icon: "landmark" as const },
    { name: "Auditores", icon: "search" as const },
    { name: "Ciudadanos", icon: "users" as const },
  ],
  core: {
    name: "Arkelythex",
    role: "Capa de confianza",
    infrastructure: ["Platform", "Drenyra", "Grid"] as const,
  },
} as const;

export function OperatingSystem(): ReactElement {
  const { operatingSystem } = { operatingSystem: OS_COPY };

  return (
    <section
      id="operating-system"
      className="relative py-32 md:py-40 bg-foreground/[0.03]"
      aria-label="Sistema operativo de datos"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-20 text-center">
            <p className={`${LANDING_EYEBROW_CLASS} mb-4`}>
              {operatingSystem.eyebrow}
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground text-balance mb-6">
              {operatingSystem.headline}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {operatingSystem.subheadline}
            </p>
          </div>
        </ScrollReveal>

        {/* Node diagram */}
        <ScrollReveal>
          <motion.div
            className="relative mx-auto max-w-4xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Actors row */}
            <motion.div
              className="flex justify-center items-center gap-6 md:gap-10 mb-8 flex-wrap"
              variants={stagger}
            >
              {operatingSystem.actors.map((actor) => (
                <motion.div
                  key={actor.name}
                  variants={fadeInUp}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 border border-border bg-foreground/[0.04] flex items-center justify-center hover:border-border-strong transition-colors">
                    <ActorIcon icon={actor.icon} />
                  </div>
                  <p className="text-xs font-medium tracking-[0.1em] uppercase text-section-label">
                    {actor.name}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Connecting lines — converge to center */}
            <div className="flex justify-center mb-8">
              <motion.div
                className="w-px h-12 bg-foreground/30 origin-top"
                variants={lineDraw}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
            </div>

            {/* Aevon — central node */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="relative border-2 border-foreground/20 bg-foreground/[0.04] px-12 py-6 text-center">
                {/* Accent dots */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-foreground/40 -translate-x-1 -translate-y-1" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-foreground/40 translate-x-1 -translate-y-1" />
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-foreground/40 -translate-x-1 translate-y-1" />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-foreground/40 translate-x-1 translate-y-1" />
                <p className="text-xs font-medium tracking-[0.15em] uppercase text-section-label mb-1">
                  {operatingSystem.core.role}
                </p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {operatingSystem.core.name}
                </p>
              </div>
            </motion.div>

            {/* Connecting line — bottom */}
            <div className="flex justify-center mb-8">
              <motion.div
                className="w-px h-12 bg-foreground/30 origin-top"
                variants={lineDraw}
                transition={{ duration: 0.5, delay: 0.9 }}
              />
            </div>

            {/* Infrastructure nodes */}
            <motion.div
              className="flex justify-center items-center gap-8 md:gap-12"
              variants={stagger}
            >
              {operatingSystem.core.infrastructure.map((infra) => (
                <motion.div
                  key={infra}
                  variants={fadeInUp}
                  transition={{ duration: 0.4 }}
                  className="border border-border bg-foreground/[0.04] px-6 py-3 text-center hover:border-border-strong transition-colors"
                >
                  <p className="text-sm font-medium text-foreground tracking-tight">
                    {infra}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Base label */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="text-center mt-12 text-xs font-medium tracking-[0.2em] uppercase text-section-label"
            >
              La inteligencia fluye a través de toda la plataforma
            </motion.p>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/**
 * Simple SVG icons for each actor — minimal, institutional.
 */
function ActorIcon({ icon }: { icon: string }): ReactElement {
  const className = "w-6 h-6 text-muted-foreground";

  switch (icon) {
    case "building":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="2" width="16" height="20" rx="1" />
          <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      );
    case "landmark":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
        </svg>
      );
    case "search":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
