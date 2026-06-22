/**
 * Copy para la página de precios /precios.
 * Texto en español para el mercado peruano.
 * Monocromatic elite edition — precios validados con contabilidad de costos real.
 * Márgenes brutos: 68%+ en todos los planes (modelo Mayo 2026).
 */

export const PRECIOS_COPY = {
  hero: {
    tagline: "Precios transparentes",
    headline: "Planes diseñados para",
    headlineEmphasis: "escalar con tu operación.",
    subhead:
      "Activación guiada. Sin cobro automático todavía. Validamos primero el piloto y luego formalizamos el plan correcto.",
    ctaPrimary: "Solicitar piloto",
    ctaPrimaryHref: "/demo",
    ctaSecondary: "Hablar por WhatsApp",
    ctaSecondaryHref: "/demo",
  },

  plans: [
    {
      name: "Esencial",
      description:
        "Para startups y pequeños negocios que necesitan facturación electrónica con validación SUNAT real.",
      monthlyPrice: "S/149",
      annualPrice: "S/1,490",
      annualDiscount: "Ahorra S/298",
      features: [
        "Hasta 500 comprobantes/mes",
        "Facturación electrónica SUNAT (OSE)",
        "1 usuario operativo",
        "1 RUC",
        "Soporte por email",
        "Reportes básicos",
        "Portal de clientes",
      ],
      cta: "Solicitar piloto Esencial",
      href: "/demo",
      popular: false,
    },
    {
      name: "Pro",
      description:
        "Para negocios en crecimiento que gestionan múltiples RUCs y necesitan control fiscal avanzado.",
      monthlyPrice: "S/249",
      annualPrice: "S/2,490",
      annualDiscount: "Ahorra S/498",
      features: [
        "Hasta 1,000 comprobantes/mes",
        "Facturación OSE + PSE",
        "Hasta 3 usuarios",
        "Hasta 3 RUCs",
        "Soporte prioritario",
        "Reportes fiscales avanzados",
        "Portal de clientes",
        "Validación masiva SIRE",
        "Calendario tributario",
      ],
      cta: "Solicitar piloto Pro",
      href: "/demo",
      popular: true,
    },
    {
      name: "Team",
      description:
        "Para estudios contables y PYMES que gestionan múltiples RUCs con API, PSE y SSO corporativo.",
      monthlyPrice: "S/449",
      annualPrice: "S/4,490",
      annualDiscount: "Ahorra S/898",
      features: [
        "Hasta 2,000 comprobantes/mes",
        "Facturación OSE + PSE",
        "Hasta 10 usuarios",
        "Hasta 10 RUCs incluidos",
        "Soporte prioritario",
        "Reportes avanzados de riesgo fiscal",
        "Portal de clientes",
        "Validación masiva SIRE",
        "API Access",
        "SSO corporativo",
      ],
      cta: "Solicitar piloto Team",
      href: "/demo",
      popular: false,
    },
    {
      name: "Scale",
      description:
        "Para empresas con alto volumen que necesitan capacidad enterprise y soporte dedicado.",
      monthlyPrice: "S/1,199",
      annualPrice: "S/11,990",
      annualDiscount: "Ahorra S/2,398",
      features: [
        "Hasta 10,000 comprobantes/mes",
        "Facturación OSE + PSE",
        "Usuarios ilimitados",
        "RUCs ilimitados",
        "Soporte dedicado",
        "Reportes personalizados",
        "API access",
        "SSO corporativo",
        "SLA 99.9% uptime",
        "Onboarding personalizado",
      ],
      cta: "Solicitar piloto Scale",
      href: "/demo",
      popular: false,
    },
  ],

  comparison: {
    tagline: "Comparación",
    headline: "Lo que incluye cada plan.",
    headers: ["Característica", "Esencial", "Pro", "Team", "Scale"],
    rows: [
      { feature: "Comprobantes/mes", esencial: "500", pro: "1,000", team: "2,000", scale: "10,000" },
      { feature: "Usuarios", esencial: "1", pro: "3", team: "10", scale: "Ilimitado" },
      { feature: "RUCs", esencial: "1", pro: "3", team: "10", scale: "Ilimitado" },
      { feature: "Facturación OSE/PSE", esencial: true, pro: true, team: true, scale: true },
      { feature: "Portal de clientes", esencial: true, pro: true, team: true, scale: true },
      { feature: "Calendario tributario", esencial: false, pro: true, team: true, scale: true },
      { feature: "Validación masiva SIRE", esencial: false, pro: true, team: true, scale: true },
      { feature: "Reportes fiscales avanzados", esencial: false, pro: true, team: true, scale: true },
      { feature: "API Access", esencial: false, pro: false, team: true, scale: true },
      { feature: "SSO corporativo", esencial: false, pro: false, team: true, scale: true },
      { feature: "Soporte dedicado", esencial: false, pro: false, team: false, scale: true },
      { feature: "Onboarding", esencial: false, pro: false, team: false, scale: true },
    ],
  },

  faq: {
    tagline: "Preguntas frecuentes",
    items: [
      {
        question: "¿Puedo cambiar de plan en cualquier momento?",
        answer:
          "Sí. Durante la fase de piloto, ajustamos el plan antes de activar cobro recurrente. Cuando la pasarela esté habilitada, los cambios aplicarán al siguiente ciclo de facturación.",
      },
      {
        question: "¿Qué pasa si excedo el límite de comprobantes?",
        answer:
          "Te notificamos al 80%. En piloto revisamos volumen real y recomendamos migrar al siguiente plan antes de activar automatización de cobro.",
      },
      {
        question: "¿Los precios incluyen IGV?",
        answer:
          "No. Los precios son más IGV (18%). La emisión de comprobantes se activa cuando la estructura legal y tributaria esté lista para operación comercial.",
      },
      {
        question: "¿Hay prueba gratuita?",
        answer:
          "Sí. El piloto inicial es guiado y sin tarjeta. Primero validamos encaje operativo; después se formaliza plan, contrato y facturación.",
      },
      {
        question: "¿Qué métodos de pago aceptan?",
        answer:
          "Durante el MVP aceptamos coordinación manual por transferencia/Yape. La pasarela online recomendada para Perú será Culqi; Mercado Pago queda como fallback y PayPal solo para clientes internacionales.",
      },
    ],
  },

  enterpriseCTA: {
    headline: "¿Necesitás algo a medida?",
    description:
      "Si tu operación requiere volúmenes altos, integraciones específicas o condiciones especiales, hablá con nuestro equipo.",
    cta: "Solicitar piloto",
    href: "/demo",
  },

  toggle: {
    monthly: "Mensual",
    annual: "Anual",
    saveLabel: "2 meses gratis al año",
  },

  disclaimer: {
    text: "Precios referenciales en soles peruanos más IGV. El cobro online se habilitará después de completar estructura legal, facturación y pasarela.",
  },
} as const;
