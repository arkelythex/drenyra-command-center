/**
 * Copy para la página de demo /demo.
 * Texto en español para el mercado peruano.
 */

export const DEMO_COPY = {
  hero: {
    tagline: "Demo personalizada",
    headline: "Agenda una",
    headlineEmphasis: "demo de 30 minutos.",
    subhead:
      "Sin compromiso. Sin PPT. Una sesión real con tu entorno de datos donde validamos juntos si Arkelythex resuelve tu operación.",
    description:
      "Te mostramos el flujo completo con tu tipo de documento, volumen y reglas SUNAT vigentes. Tú decides si funciona.",
    ctaPrimary: "Agendar demo",
    ctaPrimaryHref: "/demo",
    ctaSecondary: "Ver precios",
    ctaSecondaryHref: "/precios",
  },

  process: {
    tagline: "Cómo funciona",
    headline: "Tres pasos para conocer Arkelythex.",
    steps: [
      {
        number: 1,
        title: "Agenda tu sesión",
        description:
          "Reserva 30 minutos en el calendario. Selecciona el turno que prefieras y te enviamos la confirmación al instante.",
        duration: "30 minutos",
      },
      {
        number: 2,
        title: "Conoce tu entorno",
        description:
          "Mostramos Arkelythex con tus tipos de documento, volúmenes reales y reglas SUNAT activas. Demo personalizada, no genérica.",
        duration: "Demo personalizada",
      },
      {
        number: 3,
        title: "Decide con datos",
        description:
          "Cerramos con una propuesta comercial transparente. Sin presión. Si no es para ti, te référimos a quien sí pueda ayudar.",
        duration: "Sin compromiso",
      },
    ],
  },

  trustBadges: {
    tagline: "Confianza institucional",
    items: [
      {
        title: "Alineado a SOC 2",
        description: "Controles de seguridad usados como referencia operativa.",
      },
      {
        title: "Alineado a ISO 27001",
        description: "Prácticas de gestión de seguridad como marco de diseño.",
      },
      {
        title: "Interoperabilidad SUNAT",
        description: "Flujos diseñados para evidencia y validaciones tributarias.",
      },
      {
        title: "Cifrado de datos",
        description: "Protección de datos en tránsito y en reposo.",
      },
    ],
  },

  faq: {
    tagline: "Preguntas frecuentes",
    items: [
      {
        question: "¿Qué necesito para la demo?",
        answer:
          "Solo tu RUC y acceso a internet. No instalamos nada en tu máquina. La demo corre en nuestro entorno cloud seguro.",
      },
      {
        question: "¿La demo tiene costo?",
        answer:
          "No. La sesión de 30 minutos es completamente gratuita. No te pedimos tarjeta de crédito ni compromiso de compra.",
      },
      {
        question: "¿Puedo pedir una demo para mi estudio contable con varios clientes?",
        answer:
          "Sí. Podemos configurar la demo con múltiples RUCs y mostrar cómo Drenyra maneja la operación multi-cliente.",
      },
      {
        question: "¿Qué pasa si después de la demo decido no continuar?",
        answer:
          "No hay penalidad. Te enviamos un resumen de lo visto y si lo deseas, te référimos a otra solución que se ajuste mejor a tu caso.",
      },
    ],
  },

  pricingCta: {
    tagline: "Inversión",
    headline: "Planes diseñados para PYMES peruanas.",
    subhead:
      "Desde S/ 149 mensuales. Sin contratos inflexibles. Cancela cuando quieras.",
    ctaLabel: "Ver planes",
    ctaHref: "/precios",
  },
} as const;
