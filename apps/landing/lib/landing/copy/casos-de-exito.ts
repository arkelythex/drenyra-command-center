/**
 * Copy para la página de casos de éxito /casos-de-exito.
 * Texto en español para el mercado peruano.
 */

export const CASOS_COPY = {
  hero: {
    tagline: "Casos de éxito",
    headline: "Empresas que ya operan con",
    headlineEmphasis: "control y confianza.",
    subhead:
      "Cómo estudios contables, retail y fintech peruana redujeron errores, ahorraron tiempo y cumplieron con SUNAT sin estrés.",
    description:
      "Estos son resultados ilustrativos basados en operaciones tipo. Los resultados reales varían según el contexto, volumen y complejidad de cada empresa.",
    ctaPrimary: "Solicitar demo",
    ctaPrimaryHref: "/demo",
    ctaSecondary: "Ver precios",
    ctaSecondaryHref: "/precios",
  },

  cases: [
    {
      industry: "Retail",
      role: "CFO",
      products: ["SIRE", "Contabilidad"],
      layout: "hero-metrics",
      challenge:
        "El cierre mensual de operaciones tomaba 5 días porque el equipo conciliaba manualmente facturas, notas de crédito y detracciones. Los errores en la prevalidación generaban contingencias con SUNAT.",
      solution:
        "Implementaron la automatización SIRE + Contabilidad operativa para prevalidación de comprobantes y detección automática de inconsistencias antes del envío a SUNAT.",
      results: [
        "85% menos tiempo en cierre mensual",
        "0 errores SUNAT en el último trimestre",
        "Prevalidación en tiempo real durante todo el mes",
        "Evidencia estructurada para cada decisión contable",
      ],
      quote:
        "Pasamos de 5 días de cierre a 2 horas. El equipo ahora se enfoca en análisis, no en recopilar datos.",
      author: "CFO, Retail pollería con 12 sucursales",
      metrics: [
        { value: "85%", label: "menos tiempo" },
        { value: "0", label: "errores SUNAT" },
        { value: "2h", label: "vs 5 días" },
      ],
    },
    {
      industry: "Estudio contable",
      role: "Contador principal",
      products: ["Gestión de estudios", "Contabilidad"],
      layout: "split",
      challenge:
        "Manejaban 30 clientes con 30 RUCs diferentes, cada uno con sus propias reglas, calendarios de vencimiento y formatos. El equipo desperdiciaba horas en tareas repetitivas que podían automatizarse.",
      solution:
        "Multi-RUC + plantillas personalizadas + calendario tributario inteligente en Drenyra. Cada cliente tiene su flujo de trabajo automatizado sin intervención manual.",
      results: [
        "3 veces más clientes sin contratar personal adicional",
        "Alertas automáticas de vencimientos (7 días antes)",
        "Reportes consolidados por cliente en un click",
        "Tiempo de respuesta a SUNAT reducido de 48h a 4h",
      ],
      quote:
        "Antes atendía 30 clientes casi al límite. Ahora manejo 90 con el mismo equipo y menor estrés.",
      author: "Contador principal, Estudio con 90 clientes",
      metrics: [
        { value: "3x", label: "más clientes" },
        { value: "90", label: "clientes activos" },
        { value: "4h", label: "vs 48h respuesta" },
      ],
    },
    {
      industry: "Fintech",
      role: "CTO",
      products: ["Análisis fiscal", "API"],
      layout: "narrative",
      challenge:
        "La validación fiscal en tiempo real era un cuello de botella. Cada transacción debía verificarse contra las reglas SUNAT antes de ejecutarse, y la latencia afectaba la experiencia del usuario final.",
      solution:
        "Integraron la API de Drenyra para validación fiscal en tiempo real con tiempos de respuesta menores a 200ms. El motor de reglas SUNAT corre en paralelo sin bloquear el flujo.",
      results: [
        "Respuesta en menos de 200ms por validación",
        "99.97% uptime del servicio de validación",
        "Escalabilidad para 10,000+ transacciones/hora",
        "Monitoreo en tiempo real con alertas predictivas",
      ],
      quote:
        "La latencia era nuestro mayor problema. Con Arkelythex la validación corre en background y el usuario no nota nada.",
      author: "CTO, Fintech de pagos con 50K usuarios",
      metrics: [
        { value: "<200ms", label: "respuesta" },
        { value: "99.97%", label: "uptime" },
        { value: "10K+", label: "trans/hora" },
      ],
    },
  ],

  disclaimer: {
    text: "Resultados ilustrativos. Los resultados reales varían según el contexto de cada empresa.",
    legalNote:
      "Estos casos representan operaciones tipo y no garantizan resultados idénticos. Los nombres de empresa y datos específicos son ficticios para proteger la privacidad de nuestros clientes.",
  },

  cta: {
    tagline: "¿Listo para ser el siguiente caso?",
    headline: "Agenda una demo personalizada",
    description:
      "En 30 minutos te mostramos cómo Arkelythex se adapta a tu operación específica. Sin compromiso, sin PPT, con tus datos reales.",
    cta: "Solicitar demo",
    href: "/demo",
  },
} as const;