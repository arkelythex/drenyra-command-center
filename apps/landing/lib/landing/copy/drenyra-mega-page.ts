/**
 * Copy para la mega-page de Drenyra — plataforma integral de contabilidad inteligente.
 * Tono: profesional, empoderador, específico para Perú, sin humildad.
 * Palabras clave: "Plataforma integral", "Todo en un solo lugar", "Agentes IA 24/7", "Evidencia completa".
 * Evitar: "Suite", "módulos separados", "herramientas", "producto", "software".
 */

export const DRENYRA_MEGA_COPY = {
  hero: {
    tagline: "Plataforma integral de contabilidad inteligente",
    headline: "Contabilidad inteligente que",
    headlineEmphasis: "piensa por ti",
    subhead:
      "Drenyra centraliza facturación, conciliación, análisis fiscal y SIRE en una sola plataforma con agentes IA que trabajan 24/7. Cada decisión deja evidencia auditable.",
    ctaPrimary: "Comenzar piloto GRATIS",
    ctaPrimaryHref: "#drenyra-pricing",
    ctaSecondary: "Ver cómo funciona",
    ctaSecondaryHref: "#drenyra-como-funciona",
  },

  trustBar: {
    metrics: [
      {
        value: "93%+",
        label: "Auto-booking",
        detail: "de comprobantes procesados sin intervención manual",
      },
      {
        value: "97.8%",
        label: "Precisión",
        detail: "vs 79.1% de precisión humana promedio",
      },
      {
        value: "12,000+",
        label: "Integraciones",
        detail: "bancarias y plataformas conectadas",
      },
    ],
  },

  queEs: {
    tagline: "El problema",
    headline: "Herramientas dispersas, cierre caótico",
    problem:
      "Los equipos contables peruanos usan 5-7 herramientas diferentes: Excel para asientos, otro software para facturación, un sistema para SIRE, y manuales para conciliación. Cada herramienta genera datos aislados, sin evidencia centralizada.",
    solution:
      "Drenyra reemplaza todo eso con una sola plataforma integral. Agentes IA especializados procesan, validan y dejan evidencia completa. Vos revisás y aprobás. Sin retrabajo, sin sorpresas.",
    items: [
      {
        title: "Sin evidencia",
        description:
          "Cada decisión fiscal queda documentada con TraceId, fuente documental y bitácora exportable.",
      },
      {
        title: "Sin retrabajo",
        description:
          "Prevalidación automática antes del envío. Detectamos errores antes de que SUNAT los detecte.",
      },
      {
        title: "Sin sorpresas",
        description:
          "Panel de riesgo en tiempo real. Cada RUC tiene su contexto, vencimientos y estados de revisión.",
      },
    ],
  },

  modulos: {
    tagline: "Capacidades integradas",
    headline: "Todo lo que necesitás, en un solo lugar",
    description:
      "Drenyra integra todas las capacidades contables y fiscales en una plataforma unificada. No son módulos separados — son partes de un mismo sistema inteligente.",
    items: [
      {
        id: "contabilidad",
        title: "Contabilidad operativa",
        hint: "Asientos, comprobantes y revisión",
        description:
          "Asientos auditables con origen, regla aplicada y estado de revisión. Multi-RUC, bitácora completa y exportación de evidencia.",
        features: [
          "Asientos con trazabilidad",
          "Multi-RUC",
          "Bitácora de revisión",
          "Exportación de evidencia",
        ],
      },
      {
        id: "estudios",
        title: "Gestión de estudios",
        hint: "Multi-RUC y calendario tributario",
        description:
          "Gestioná tu cartera de clientes desde un solo panel. Calendario tributario, monitoreo de riesgo y portal de clientes incluido.",
        features: [
          "Multi-RUC",
          "Calendario tributario",
          "Monitoreo de riesgo",
          "Portal de clientes",
        ],
      },
      {
        id: "analisis",
        title: "Análisis fiscal",
        hint: "Riesgo y priorización inteligente",
        description:
          "Señales tributarias priorizadas por impacto. Reglas versionadas, action queue y command view para decisiones de cierre.",
        features: [
          "Riesgo priorizado",
          "Reglas versionadas",
          "Action queue",
          "Command view",
        ],
      },
      {
        id: "sire",
        title: "SIRE + facturación",
        hint: "Cierre mensual sin sorpresas",
        description:
          "Estados de decisión, evidencia audit-ready y revisión guiada para SIRE y facturación electrónica UBL 2.1.",
        features: [
          "Estados de decisión",
          "Evidencia audit-ready",
          "Revisión guiada",
          "UBL 2.1",
        ],
      },
    ],
  },

  agentes: {
    tagline: "Agentes IA especializados",
    headline: "8 agentes que trabajan 24/7",
    description:
      "Cada agente está entrenado para una tarea específica del proceso contable y fiscal. Trabajan en paralelo, se comunican entre sí y dejan evidencia completa de cada decisión.",
    items: [
      {
        name: "Contabilidad",
        description:
          "Procesa comprobantes, genera asientos y reconcilia transacciones automáticamente.",
        icon: "book",
      },
      {
        name: "Finanzas",
        description:
          "Análisis financiero, dashboards en tiempo real y proyecciones de flujo de caja.",
        icon: "chart",
      },
      {
        name: "Reportes",
        description:
          "Genera reportes contables, fiscales y gerenciales con evidencia completa.",
        icon: "file",
      },
      {
        name: "SIRE",
        description:
          "Prepara, valida y envía declaraciones SIRE con prevalidación automática.",
        icon: "check",
      },
      {
        name: "Cumplimiento",
        description:
          "Monitoreo continuo de cumplimiento normativo y alertas proactivas.",
        icon: "shield",
      },
      {
        name: "Conciliación",
        description:
          "Conciliación bancaria y contable con detección automática de divergencias.",
        icon: "refresh",
      },
      {
        name: "Documentos",
        description:
          "Gestión inteligente de documentos, clasificación automática y archivado.",
        icon: "folder",
      },
      {
        name: "Analítica",
        description:
          "Análisis de patrones, anomalías y oportunidades de optimización fiscal.",
        icon: "brain",
      },
    ],
  },

  comoFunciona: {
    tagline: "Flujo de trabajo",
    headline: "De la ingesta a la evidencia en 4 pasos",
    steps: [
      {
        number: "01",
        title: "Conectá",
        description:
          "Conectá tus fuentes de datos: facturas, boletas, extractos bancarios y comprobantes SUNAT. Importación automática desde Excel, CSV o integraciones directas.",
      },
      {
        number: "02",
        title: "Procesá",
        description:
          "Los agentes IA procesan, clasifican y validan cada documento. Prevalidación automática contra reglas SUNAT y detección de inconsistencias.",
      },
      {
        number: "03",
        title: "Revisá",
        description:
          "Revisá las decisiones de los agentes en un panel claro. Aprobá, editá o rechazá con contexto completo. Cada acción queda registrada.",
      },
      {
        number: "04",
        title: "Exportá",
        description:
          "Generá evidencia completa: expedientes de auditoría, declaraciones SIRE y reportes contables. Todo con TraceId y bitácora exportable.",
      },
    ],
  },

  casosDeUso: {
    tagline: "Casos de uso",
    headline: "Para cada equipo contable",
    items: [
      {
        title: "Empresa",
        description:
          "Cierre mensual automatizado, multi-RUC y evidencia completa para equipos internos que necesitan control, no promesas.",
      },
      {
        title: "Estudio contable",
        description:
          "Gestión de cartera multi-RUC, calendario tributario y portal de clientes. Escalá sin crecer en personal.",
      },
      {
        title: "Banco / Fintech",
        description:
          "Conciliación masiva, compliance automatizado y dashboards en tiempo real para instituciones financieras.",
      },
    ],
  },

  pricing: {
    tagline: "Precios",
    headline: "Elegí el plan que necesitás",
    description:
      "Precios más IGV. Sin costos ocultos ni cargos por configuración inicial.",
    plans: [
      {
        name: "Esencial",
        price: "S/149",
        period: "/mes",
        description: "Para equipos pequeños que necesitan cierre mensual ordenado.",
        features: [
          "1 RUC",
          "Hasta 500 comprobantes/mes",
          "Agentes IA básicos",
          "SIRE + facturación",
          "Soporte por email",
        ],
        cta: "Comenzar piloto",
        ctaHref: "#drenyra-cta-final",
      },
      {
        name: "Pro",
        price: "S/249",
        period: "/mes",
        description: "Para equipos que necesitan multi-RUC y análisis fiscal avanzado.",
        features: [
          "Hasta 5 RUC",
          "Comprobantes ilimitados",
          "Todos los agentes IA",
          "Análisis de riesgo",
          "Multi-usuario",
          "Soporte prioritario",
        ],
        popular: true,
        cta: "Comenzar piloto",
        ctaHref: "#drenyra-cta-final",
      },
      {
        name: "Scale",
        price: "S/1,199",
        period: "/mes",
        description: "Para estudios y empresas con operaciones complejas.",
        features: [
          "RUCs ilimitados",
          "Comprobantes ilimitados",
          "API completa",
          "Agentes personalizados",
          "SLA garantizado",
          "Onboarding dedicado",
        ],
        cta: "Contactar ventas",
        ctaHref: "/contact",
      },
    ],
  },

  faq: {
    tagline: "Preguntas frecuentes",
    headline: "Todo lo que necesitás saber",
    items: [
      {
        question: "¿Qué es Drenyra exactamente?",
        answer:
          "Drenyra es una plataforma integral de contabilidad inteligente. Centraliza facturación, conciliación, análisis fiscal y SIRE en una sola interfaz, con agentes IA que trabajan 24/7.",
      },
      {
        question: "¿Reemplaza a mi equipo contable?",
        answer:
          "No. Drenyra potencia al equipo contable. Automatiza tareas repetitivas y da evidencia, pero la decisión y supervisión humana siempre es obligatoria.",
      },
      {
        question: "¿Cuánto tarda en implementarse?",
        answer:
          "El piloto dura 14 días. Importás tus comprobantes, conectás tu RUC y Drenyra empieza a trabajar en tu primer cierre mensual.",
      },
      {
        question: "¿Es compatible con mi sistema actual?",
        answer:
          "Sí. Importamos desde Excel, CSV o integraciones directas. Drenyra se conecta a tu stack sin reemplazarlo.",
      },
      {
        question: "¿Qué pasa si SUNAT me audita?",
        answer:
          "Cada decisión tiene un TraceId, fuente documental y bitácora exportable. Podés generar tu expediente de auditoría en minutos.",
      },
      {
        question: "¿Puedo empezar solo con facturación y escalar después?",
        answer:
          "Sí. El plan Esencial incluye facturación, SIRE y agentes IA básicos. Cuando necesites multi-RUC, análisis de riesgo o API, escalás a Pro o Scale sin migrar datos.",
      },
    ],
  },

  ctaFinal: {
    headline: "Tu contabilidad merece inteligencia artificial",
    subhead:
      "Uníte a los equipos contables peruanos que ya operan con evidencia, no con fe.",
    ctaPrimary: "Comenzar piloto GRATIS",
    ctaPrimaryHref: "#drenyra-pricing",
    ctaSecondary: "Agendar demo",
    ctaSecondaryHref: "/demo",
  },
} as const;
