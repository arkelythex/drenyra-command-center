/**
 * CTA final, pie y strings del mockup (UI de ejemplo).
 *
 * @see docs/concepts/sunat-regulations-2026.md — no afirmar integración en vivo al portal salvo producto acordado.
 * @see docs/business/claim-register-2026.md
 */
import { siteConfig } from "@/lib/seo/config";

export const closingCopy = {
	finalCta: {
		headlineLead: "El sistema operativo fiscal",
		headlineAccent: "para contadores que no pueden fallar.",
		ctaPrimary: "Agendar demo",
		ctaSecondary: "Hablar con el equipo",
		ctaPrimaryHref: "/demo",
		ctaSecondaryHref: `mailto:${siteConfig.contactEmail}?subject=Hablar%20con%20el%20equipo%20Arkelythex`,
		proofChips: [
			"SIRE como prioridad",
			"Evidencia exportable",
			"Trazabilidad lista para auditoría",
		] as const,
		sessionTitle: "En una sesión corta revisamos",
		sessionItems: [
			"Dónde hoy se acumula retrabajo, riesgo y validación manual.",
			"Si conviene entrar por wedge SIRE, multi-RUC o integración API.",
			"Qué siguiente paso tiene sentido: demo, piloto o despliegue guiado.",
		] as const,
		highlights: [
			{
				title: "Revisamos tu cierre actual",
				detail:
					"Priorizamos divergencias, riesgo del periodo y puntos ciegos antes de declarar.",
			},
			{
				title: "Definimos el wedge correcto",
				detail:
					"SIRE-first, operación multi-RUC o API fiscal según etapa y complejidad.",
			},
			{
				title: "Acordamos siguiente paso",
				detail:
					"Demo guiada, piloto o despliegue con foco en evidencia y control operativo.",
			},
		] as const,
		proofNote:
			"No prometemos automatización ciega: evaluamos proceso, volumen documental y riesgo real.",
	},

	footer: {
		tagline:
			"Command Center Fiscal: IA + SUNAT + evidencia + trazabilidad. Diseñado en Perú para contextos regulatorios exigentes.",
		community: "Comunidad",
		legalEntity: "Arkelythex Intelligence",
		location: "Lima, Perú",
		productLinks: [
			{ label: "API Docs", href: "/api" },
			{ label: "API", href: "/api" },
			{ label: "Drenyra", href: "/drenyra" },
			{ label: "Precios", href: "/drenyra#drenyra-pricing" },
		] as const,
	},

	mockup: {
		searchPlaceholder: "Buscar expediente, RUC o periodo",
		modulesNavLabel: "Capacidades",
		modules: [
			{ name: "Contabilidad", active: true },
			{ name: "Análisis", active: false },
			{ name: "SIRE", active: false },
		] as const,
		sunatStatusTitle: "Estado fiscal (demo)",
		sunatStatusValue: "Vista integrada · ejemplo",
		workspaceBadge: "Revisión del periodo",
		workspaceTitle: "Expediente fiscal Q2 2026",
		workspaceMetaPeriod: "Abril 2026",
		workspaceMetaDocs: "154 comprobantes",
		priorityCaseTitle: "Divergencia detectada",
		priorityCaseSummary:
			"Compra observada vs XML registrado antes de declarar.",
		priorityCaseImpactLabel: "Impacto estimado",
		priorityCaseImpactValue: "S/ 2,430",
		priorityCaseProbabilityLabel: "Probabilidad de observación",
		priorityCaseProbabilityValue: "68%",
		priorityCasePrimaryAction: "Ver detalle",
		priorityCaseSecondaryAction: "Corregir ahora",
		chartProjectionTitle: "Riesgo priorizado",
		chartAuditTitle: "Evidencia disponible",
		chartAuditPercent: "85% completado",
		reviewPanelKicker: "Cumplimiento y riesgos",
		reviewPanelTitle: "Monitoreo activo",
		alerts: [
			{
				variant: "critical" as const,
				title: "Divergencia SIRE",
				description: "Inconsistencia en compras detectada antes de declarar.",
			},
			{
				variant: "success" as const,
				title: "Validación UBL 2.1",
				description: "Estructura del comprobante conforme a validación previa.",
			},
			{
				variant: "info" as const,
				title: "Guardrails activos",
				description:
					"Revisión humana requerida para expediente de alto impacto.",
			},
		] as const,
		riskIndexLabel: "Índice de riesgo del periodo",
		riskIndexValue: "94.2%",
		auditCta: "Ejecutar revisión",
	},
} as const;
