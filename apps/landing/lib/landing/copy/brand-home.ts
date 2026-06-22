/**
 * Copy para la home de marca (/).
 * Narrativa: Arkelythex — empresa madre, plataforma de infraestructura fiscal LATAM.
 * Hero → Trust → Mission → Stack → Why It Exists → Applications → Operating System → Social Proof → CTA.
 */

export const BRAND_HOME_COPY = {
  hero: {
    eyebrow: "Infrastructure for Fiscal Intelligence",
    headline: "Plataforma de Infraestructura Fiscal\npara Latinoamérica",
    subheadline:
      "Arkelythex construye la capa de confianza para inteligencia fiscal-operativa: agentes gobernados, evidencia auditable y cumplimiento normativo a escala continental. Drenyra es nuestra aplicación insignia.",
    ctaPrimary: "Explorar Drenyra",
    ctaPrimaryHref: "/drenyra",
    ctaSecondary: "Conocer la plataforma",
    ctaSecondaryHref: "#why-it-exists",
  },

  stats: {
    mission:
      "La infraestructura que conecta datos, evidencia, agentes y decisiones a escala continental.",
  },

  trustBar: [
    { value: 250, suffix: "+", label: "empresas en la plataforma" },
    { value: 15, suffix: "M+", label: "comprobantes procesados" },
    { value: 99.9, suffix: "%", label: "uptime operacional" },
  ] as const,

  whyItExists: {
    eyebrow: "Por Qué Existimos",
    headline:
      "Problemas continentales que requieren infraestructura, no aplicaciones",
    problems: [
      {
        title: "Informalidad",
        stat: "73%",
        context:
          "de la fuerza laboral peruana opera en la informalidad (INEI/ENAHO 2023)",
        description:
          "Sin datos formales, no hay inteligencia posible. Solo 3 de cada 10 trabajadores tienen empleo formal con beneficios. La infraestructura debe capturar evidencia donde no la hay.",
      },
      {
        title: "Evasión",
        stat: "S/ 100B+",
        context:
          "perdidos anualmente por evasión tributaria en Perú (SUNAT 2026)",
        description:
          "La carga fiscal más baja desde 2010. Los sistemas actuales reaccionan. Necesitan predecir, prevenir y coordinar respuesta en tiempo real.",
      },
      {
        title: "Fragmentación",
        stat: "0",
        context:
          "sistemas conectados entre dominios fiscal, legal y operativo",
        description:
          "Cada dominio habla su propio dialecto. Sin contratos tipados, la coordinación es imposible.",
      },
      {
        title: "Corrupción",
        stat: "30/100",
        context:
          "puntuación de Perú en el Índice de Percepción de la Corrupción 2025 (Transparency International)",
        description:
          "Perú cayó 8 puntos en 5 años. La trazabilidad completa elimina la opacidad. Cada decisión queda registrada con evidencia.",
      },
      {
        title: "Falta de evidencia",
        stat: "89%",
        context:
          "de decisiones fiscales se basan en intuición, no en datos",
        description:
          "Sin memoria institucional, cada decisión se toma desde cero. La infraestructura acumula conocimiento.",
      },
    ],
  },

  socialProof: {
    eyebrow: "Por Qué Arkelythex",
    tagline: "Construido para cumplimiento fiscal real.",
    metrics: [
      {
        value: "93%+",
        label: "auto-booking de comprobantes",
        icon: "trending-down" as const,
      },
      {
        value: "97.8%",
        label: "precisión vs 79.1% humana",
        icon: "zap" as const,
      },
      {
        value: "100%",
        label: "trazabilidad de decisiones",
        icon: "check-circle" as const,
      },
    ],
    signals: [
      {
        title: "SUNAT Compliant",
        description:
          "Validación fiscal en tiempo real contra reglas vigentes. IGV, retenciones, detracciones y SIRE actualizados cuando cambia la norma.",
        icon: "shield" as const,
      },
      {
        title: "Ley 29733 — Protección de Datos",
        description:
          "Cumplimiento de la Ley de Protección de Datos Personales peruana. Datos sensibles con encriptación en reposo y tránsito.",
        icon: "lock" as const,
      },
      {
        title: "Infraestructura Soberana",
        description:
          "Datos procesados en jurisdicción peruana. Sin dependencia de proveedores extranjeros para operaciones críticas.",
        icon: "server" as const,
      },
    ],
    items: [
      {
        title: "Validaciones SUNAT en tiempo real",
        description:
          "Cada comprobante se valida contra reglas fiscales vigentes antes de enviar. Errores que antes tomaban horas se resuelven en segundos.",
        icon: "shield" as const,
      },
      {
        title: "Trazabilidad completa de decisiones",
        description:
          "Cada acción queda registrada con timestamp, responsable y evidencia. Auditores obtienen contexto completo sin buscar en chats.",
        icon: "file-check" as const,
      },
      {
        title: "Cumplimiento normativo automático",
        description:
          "Reglas de IGV, retenciones, detracciones y SIRE se actualizan cuando cambia la norma. Sin depender de actualizaciones manuales.",
        icon: "refresh-cw" as const,
      },
    ],
  },

  requestAccess: {
    eyebrow: "Comenzar Ahora",
    headline:
      "Tu infraestructura fiscal merece una plataforma de élite",
    subheadline:
      "Arkelythex está diseñado para empresas peruanas que necesitan control fiscal real, no promesas de software genérico. Comenzá explorando Drenyra.",
    cta: "Explorar Drenyra",
    note:
      "Piloto gratuito de 14 días. Sin tarjeta de crédito. Setup en 24 horas.",
  },
} as const;
