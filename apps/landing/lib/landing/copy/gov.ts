/**
 * Copy para la página de gobierno de datos /gov.
 * Texto en español para el mercado peruano.
 * Estado: En desarrollo — Roadmap 2026.
 */

export const GOV_COPY = {
  hero: {
    tagline: "Gobierno de datos",
    headline: "Políticas, control",
    headlineEmphasis: "y auditoría operativa.",
    subhead:
      "Gov es la capa de gobierno que falta en los sistemas contables peruanos. Acceso, cambios y trazabilidad sin brechas.",
    disclaimer: "En desarrollo · Roadmap 2026",
    ctaLabel: "Notificarme cuando esté listo",
    ctaHref: "mailto:hola@arkelythexfounders.com?subject=Waitlist%3A%20Gov",
  },

  vision: {
    tagline: "Visión",
    headline: "El gobierno que toda empresa necesita.",
    items: [
      {
        title: "Políticas de acceso automatizadas",
        description:
          "Define quién ve qué, desde qué IP, en qué horario. Reglas expresadas en lenguaje de negocio, no en SQL.",
      },
      {
        title: "Motor de políticas de cambio",
        description:
          "Cada modificación en registros sensibles requiere justificación documentada. Sin excusa, sin amnesia.",
      },
      {
        title: "Dashboard de auditoría",
        description:
          "Panel visual de actividad por usuario, entidad y tiempo. Filtros que responden a requerimientos de auditoría en segundos.",
      },
      {
        title: "Cumplimiento normativo continuo",
        description:
          "Reglas que se actualizan cuando cambia la regulación SUNAT o la normativa laboral. Sin proyectos adicionales.",
      },
    ],
  },

  roadmap: {
    tagline: "Roadmap 2026",
    headline: "Lo que viene.",
    milestones: [
      {
        quarter: "Q2 2026",
        title: "Control de acceso por roles",
        description: "RBAC con políticas RLS activas y auditoría de accesos.",
      },
      {
        quarter: "Q3 2026",
        title: "Bitácora de cambios",
        description: "Historial completo de modificaciones con reason codes.",
      },
      {
        quarter: "Q4 2026",
        title: "Reportes de cumplimiento",
        description: "Generación automática de reportes para auditoría externa.",
      },
    ],
  },

  waitlistCta: {
    headline: "Sé el primero en enterarte.",
    subhead: "Inscríbete en la waitlist y te notificamos apenas esté disponible.",
    ctaLabel: "Notificarme cuando esté listo",
    placeholder: "tu@email.com",
    mailto: "mailto:hola@arkelythexfounders.com?subject=Waitlist%3A%20Gov",
  },
} as const;
