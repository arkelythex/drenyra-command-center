/**
 * Copy para la página de seguridad y compliance /seguridad.
 * Texto en español para el mercado peruano.
 */

export const SEGURIDAD_COPY = {
  hero: {
    tagline: "Seguridad y compliance",
    headline: "Tu información fiscal,",
    headlineEmphasis: "protegida por diseño.",
    subhead:
      "La seguridad no es una capa sobre el producto. Es el fundamento sobre el que construimos cada decisión de datos.",
    description:
      "Cifrado de extremo a extremo, validación SUNAT estructural y auditoría completa. Cada operación deja traza.",
    ctaPrimary: "Agendar demo",
    ctaPrimaryHref: "/demo",
    ctaSecondary: "Ver documentación",
    ctaSecondaryHref: "/docs/security",
  },

  pillars: {
    tagline: "Cumplimiento tributario",
    headline: "Cuatro pilares sobre los que se sostiene tu operación.",
    items: [
      {
        key: "ruc" as const,
        icon: "shield" as const,
        title: "Validación RUC (Módulo 11)",
        description:
          "Checksum de 11 dígitos antes de cada operación. Descartamos errores de tipeo antes de que lleguen a SUNAT.",
      },
      {
        key: "igv" as const,
        icon: "calculator" as const,
        title: "IGV 18% preciso",
        description:
          "Cálculo exacto del impuesto general a las ventas con las reglas vigentes por tipo de contribuyente y operación.",
      },
      {
        key: "ubl" as const,
        icon: "file-check" as const,
        title: "UBL 2.1 XML",
        description:
          "Estructura válida de comprobantes electrónicos según el estándar OSE/SUNAT. Cada documento cumple con el schema oficial.",
      },
      {
        key: "cdr" as const,
        icon: "database" as const,
        title: "CDR Almacenado",
        description:
          "Respuesta oficial de SUNAT u OSE archivada con trazabilidad completa. Disponibles para auditoría en cualquier momento.",
      },
    ],
  },

  architecture: {
    tagline: "Arquitectura de seguridad",
    headline: "Infraestructura diseñada para la defensa.",
    items: [
      {
        key: "encryption" as const,
        icon: "lock" as const,
        label: "Cifrado AES-256",
        detail: "Datos cifrados en tránsito con TLS 1.3 y en reposo con AES-256-GCM. Ningún dato sensible vive sin cifrar.",
      },
      {
        key: "rls" as const,
        icon: "users" as const,
        label: "Row Level Security (RLS)",
        detail: "Políticas de acceso a nivel de fila en PostgreSQL. Cada usuario ve exactamente lo que le corresponde según su rol.",
      },
      {
        key: "audit" as const,
        icon: "scroll" as const,
        label: "Trazabilidad de decisiones",
        detail: "Hash + timestamp + regla aplicada por cada decisión operativa. Evidencia inmutable para auditoría.",
      },
      {
        key: "hashchain" as const,
        icon: "link" as const,
        label: "Cadena de hash",
        detail: "Cada bloque de operaciones conecta con el anterior mediante hash criptográfico. Integridad verificable.",
      },
    ],
  },

  certBadges: {
    tagline: "Controles",
    headline: "Certificaciones verificadas",
    items: [
      {
        title: "Alineado a SOC 2",
        description: "Controles de acceso, disponibilidad y confidencialidad como referencia operativa.",
      },
      {
        title: "Alineado a ISO 27001",
        description: "Prácticas de gestión de seguridad de la información como marco de diseño.",
      },
      {
        title: "Integración SUNAT",
        description: "Flujos técnicos diseñados para interoperar con validaciones y evidencia tributaria.",
      },
    ],
  },

  trustCta: {
    tagline: "Próximo paso",
    headline: "Conoce cómo protegemos tus datos.",
    ctaLabel: "Agendar demo",
    ctaHref: "/demo",
  },
} as const;
