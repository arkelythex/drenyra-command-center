/**
 * Copy para la sección de ecosistema (grilla de productos).
 * Actualizado con sistema de nomenclatura Arkelythex v1.
 */

export const ECOSYSTEM_COPY = {
  tagline: "Drenyra",
  headline: "Lo que Drenyra resuelve",
  subhead:
    "Una sola plataforma integral. Contabilidad, estudios, análisis fiscal y SIRE integrados con 8 agentes IA que trabajan 24/7.",
  modules: [
    {
      key: "contabilidad" as const,
      name: "Contabilidad Operativa",
      tagline: "Asientos, comprobantes y revisión",
      description: "Emisión CPE, conciliación bancaria y cierre con evidencia estructurada.",
      href: "/drenyra#drenyra-modulos",
      badge: null,
    },
    {
      key: "estudios" as const,
      name: "Gestión de Estudios",
      tagline: "Multi-RUC y cartera",
      description: "Gestión multi-RUC, calendario tributario y monitoreo de riesgo.",
      href: "/drenyra#drenyra-modulos",
      badge: null,
    },
    {
      key: "analisis" as const,
      name: "Análisis Fiscal",
      tagline: "Riesgo y reglas versionadas",
      description: "Riesgo priorizado, action queue y validación UBL antes del cierre.",
      href: "/drenyra#drenyra-modulos",
      badge: null,
    },
    {
      key: "sire" as const,
      name: "SIRE + Facturación",
      tagline: "Electrónica y registros",
      description: "Estados de decisión, evidencia audit-ready y revisión guiada.",
      href: "/drenyra#drenyra-sire",
      badge: null,
    },
    {
      key: "agentes" as const,
      name: "8 Agentes IA",
      tagline: "Automatización 24/7",
      description: "Bookkeeping, Finance, Reporting, SIRE, Compliance, Reconciliation, Document y Analytics.",
      href: "/drenyra#drenyra-agentes",
      badge: null,
    },
    {
      key: "evidencia" as const,
      name: "Evidencia y Trazabilidad",
      tagline: "Audit-ready",
      description: "TraceId, bitácora exportable y fuentes documentales para cada decisión.",
      href: "/drenyra#drenyra-modulos",
      badge: null,
    },
    {
      key: "command" as const,
      name: "Command Center",
      tagline: "Control ejecutivo",
      description: "Panel multi-RUC con salud fiscal, proyecciones y stream de auditoría.",
      href: "/drenyra#drenyra-pricing",
      badge: null,
    },
    {
      key: "api" as const,
      name: "API Fiscal",
      tagline: "Integraciones",
      description: "API moderna para integraciones con sistemas existentes y automatizaciones.",
      href: "/api",
      badge: null,
    },
  ],
} as const;
