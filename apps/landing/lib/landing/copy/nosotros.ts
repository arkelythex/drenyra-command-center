/**
 * Copy para la página de nosotros /nosotros.
 * Texto en español para el mercado peruano.
 */

export const NOSOTROS_COPY = {
  hero: {
    tagline: "Sobre Arkelythex",
    headline: "Construimos la plataforma de inteligencia fiscal que",
    headlineEmphasis: "el mercado peruano necesita.",
    subhead:
      "Somos un equipo de contadores, ingenieros y diseñadores unidos por una misión: digitalizar la contabilidad de las PYMES peruanas.",
    description:
      "Arkelythex nació en Lima en 2024 para resolver los problemas que noi mismos enfrentamos en la práctica contable: múltiples sistemas, datos dispersos y cumplimiento tributario manual.",
    ctaPrimary: "Conocer más",
    ctaPrimaryHref: "#mision",
    ctaSecondary: "Ver precios",
    ctaSecondaryHref: "/precios",
  },

  mission: {
    title: "Nuestra misión",
    statement:
      "Democratizar la contabilidad empresarial en Perú con herramientas que antes solo estaban al alcance de grandes corporaciones. Cada PYME merece controle financiero, cumplimiento SUNAT y datos que la ayuden a crecer.",
    vision:
      "Ser la plataforma financiera de referencia para 50,000 PYMES peruanas antes de 2030, contribuyendo a la digitalización de la economía nacional.",
  },

  values: [
    {
      icon: "Award",
      title: "Excelencia",
      description:
        "No entregamos código que no cross-checkaríamos nosotros mismos. Cada feature pasa por validación de contadores reales antes de salir a producción.",
    },
    {
      icon: "ShieldCheck",
      title: "Integridad",
      description:
        "Los datos de nuestros clientes son suyos. Nunca vendemos información, nunca simulamos métricas y siempre comunicamos con transparencia ante cambios del mercado.",
    },
    {
      icon: "Lightbulb",
      title: "Innovación",
      description:
        "Implementamos nuevas tecnologías (IA, Rust/WASM, blockchain) solo cuando resuelven un problema real del cliente. No innovamos por innovar.",
    },
    {
      icon: "Heart",
      title: "Cliente primero",
      description:
        "Cada decisión de producto pasa por una pregunta: ¿esto ayuda al contador a hacer mejor su trabajo o al CFO a tomar mejores decisiones? Si no, no lo construimos.",
    },
  ],

  team: {
    note: "Nuestro equipo combina experiencia en contabilidad, tecnología y diseño de producto.",
    members: [
      {
        name: "Equipo fundador",
        role: "Contabilidad + Ingeniería + Diseño",
        description: "Contadores públicos y desarrolladores que enfrentaron los mismos problemas que resolvemos.",
      },
    ],
  },

  timeline: [
    {
      year: "2024",
      title: "Fundación",
      description: "Arkelythex nace en Lima para resolver problemas reales de contabilidad peruana.",
    },
    {
      year: "2025",
      title: "Producto",
      description: "Lanzamiento de Drenyra — la plataforma integral de contabilidad inteligente.",
    },
    {
      year: "2026",
      title: "Escalamiento",
      description: "Expansión a estudios contables, fintechs y empresas multi-RUC en todo el Perú.",
    },
  ],

  contact: {
    tagline: "Contacto",
    location: "Lima, Perú",
    email: "hola@arkelythexfounders.com",
    emailDisplay: "hola@arkelythexfounders.com",
    social: [
      {
        platform: "LinkedIn",
        handle: "arkelythex",
        url: "https://linkedin.com/company/arkelythex",
      },
      {
        platform: "Twitter",
        handle: "@arkalythix",
        url: "https://twitter.com/arkalythix",
      },
      {
        platform: "GitHub",
        handle: "arkelythex",
        url: "https://github.com/arkalythix",
      },
    ],
  },

  cta: {
    headline: "¿Quieres saber más sobre Arkelythex?",
    description:
      "Agenda una sesión de 30 minutos con nuestro equipo. Te mostramos la plataforma, respondemos tus preguntas y diseñamos juntos un plan de implementación.",
    cta: "Agendar conversación",
    href: "/demo",
  },
} as const;