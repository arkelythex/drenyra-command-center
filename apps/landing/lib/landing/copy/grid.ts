/**
 * Copy para la página de infraestructura de datos /grid.
 * Texto en español para el mercado peruano.
 * Estado: En desarrollo — Roadmap 2026.
 */

export const GRID_COPY = {
  hero: {
    tagline: "Infraestructura de datos",
    headline: "Base operacional,",
    headlineEmphasis: "sincronización en tiempo real.",
    subhead:
      "Grid es la capa de datos que conecta los módulos de Arkelythex. API bridge, cache inteligente y pipelines de datos entre empresas del grupo.",
    disclaimer: "En desarrollo · Roadmap 2026",
    ctaLabel: "Notificarme cuando esté listo",
    ctaHref: "mailto:hola@arkelythexfounders.com?subject=Waitlist%3A%20Grid",
  },

  vision: {
    tagline: "Visión",
    headline: "La infraestructura que escala con tu operación.",
    items: [
      {
        title: "Base de datos operacional",
        description:
          "PostgreSQL con схемы aislado por empresa. Cada RUC tiene su propio namespace, sin shared tables que generen contención.",
      },
      {
        title: "Sincronización en tiempo real",
        description:
          "Eventos de cambio propagados a subscribers en menos de 100ms. Consistencia eventual con orden causal garantizado.",
      },
      {
        title: "API bridge multi-empresa",
        description:
          "Conecta subsidiarias,Matrices y terceros bajo el mismo roof. API unificada con autenticación y rate limits por cuenta.",
      },
      {
        title: "Pipeline de datos auditado",
        description:
          "ETL con log de transformación, calidad de datos y validación de esquema en cada paso. Sin datos huérfanos.",
      },
    ],
  },

  roadmap: {
    tagline: "Roadmap 2026",
    headline: "Lo que viene.",
    milestones: [
      {
        quarter: "Q2 2026",
        title: "Esquemas por RUC",
        description: "Namespace aislado por empresa con RLS activo y backup independiente.",
      },
      {
        quarter: "Q3 2026",
        title: "Event streaming",
        description: "Kafka o NATS para propagación de eventos entre módulos del ecosistema.",
      },
      {
        quarter: "Q4 2026",
        title: "API Gateway",
        description: "Autenticación centralizada, rate limiting y analytics de consumo por API key.",
      },
    ],
  },

  waitlistCta: {
    headline: "Sé el primero en enterarte.",
    subhead: "Inscríbete en la waitlist y te notificamos apenas esté disponible.",
    ctaLabel: "Notificarme cuando esté listo",
    placeholder: "tu@email.com",
    mailto: "mailto:hola@arkelythexfounders.com?subject=Waitlist%3A%20Grid",
  },
} as const;
