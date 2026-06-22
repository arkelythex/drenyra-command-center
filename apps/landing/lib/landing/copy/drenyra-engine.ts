/**
 * Copy para la página de producto /drenyra.
 * Texto en español para el mercado peruano.
 */

import { DRENYRA_SUBAGENTS } from "@arkelythex/drenyra-core";

const FEATURES_ITEMS = DRENYRA_SUBAGENTS.map((a) => ({
	title: a.name,
	role: a.role,
	description: a.description,
}));

export const DRENYRA_ENGINE_COPY = {
	hero: {
		tagline: "Plataforma Integral",
		headline: "Contabilidad inteligente que",
		headlineEmphasis: "piensa por ti.",
		subhead:
			"Drenyra centraliza facturación, conciliación, análisis fiscal y SIRE en una sola plataforma con 8 agentes IA que trabajan 24/7. Cada decisión deja evidencia auditable.",
		ctaPrimary: "Comenzar piloto GRATIS",
		ctaPrimaryHref: "/drenyra#drenyra-pricing",
		ctaSecondary: "Ver capacidades",
		ctaSecondaryHref: "/drenyra#drenyra-modulos",
	},

	heroMedia: {
		demoCta: {
			label: "Demo interactiva",
			href: "/demo",
			caption:
				"Workspace fiscal central con agentes, compuertas y trazabilidad en vivo.",
		},
	},

	featureDemos: {
		tagline: "En acción",
		headline: "Tareas reales en mini-ventanas del agente.",
		intro:
			"Cada tarjeta muestra un flujo fiscal peruano: dominio, IGV, detracciones y SIRE — con terminal animado y slot de imagen para Codex.",
		items: [
			{
				title: "Explorar dominio fiscal",
				description:
					"Navega reglas de negocio, Value Objects y eventos antes de proponer asientos o envíos.",
				command: "drenyra explore domain",
				logs: [
					"> scanning packages/domain…",
					"> Money VO · IGV rules loaded",
					"> detracciones slice · OK",
				],
				mediaId: "feature-domain" as const,
			},
			{
				title: "Tests de detracciones",
				description:
					"Suite de validación sobre tablas SUNAT y umbrales antes del cierre mensual.",
				command: "drenyra test detracciones",
				logs: [
					"> running detraccion_cases…",
					"> 42 passed · 0 failed",
					"> gate: human review not required",
				],
				mediaId: "feature-detracciones" as const,
			},
			{
				title: "Validación IGV",
				description:
					"Vigila contrasta comprobantes propios vs expectativa de IGV y prioriza excepciones.",
				command: "drenyra validate igv",
				logs: [
					"> vigia.rank · 3 open",
					"> impact: S/ 12,400",
					"> awaiting operator",
				],
				mediaId: "feature-igv" as const,
			},
			{
				title: "SIRE y RVIE",
				description:
					"Eviden alinea registros SUNAT con CPE y deja expediente listo para compuerta humana.",
				command: "drenyra sync sire",
				logs: [
					"> rvie batch 48 ingested",
					"> 1,245 CPE matched",
					"> export blocked · gate open",
				],
				mediaId: "feature-sire" as const,
			},
		],
	},

	pillars: {
		tagline: "Por qué Drenyra",
		headline: "Hecho para trabajo fiscal con agentes, no solo chat.",
		items: [
			{
				title: "Flujos multi-agente coordinados",
				description:
					"Ocho subagentes especializados comparten contexto, TraceId y expediente — paralelos cuando conviene, secuenciales cuando importa el control.",
			},
			{
				title: "Compuertas humanas visibles",
				description:
					"Exportaciones, ajustes y envíos sensibles esperan aprobación con evidencia adjunta y registro de quién decidió.",
			},
			{
				title: "Evidencia antes de declarar",
				description:
					"Comprobantes, SIRE, bancos y reglas versionadas en un solo workspace — menos retrabajo y menos sorpresas en auditoría.",
			},
			{
				title: "Siempre atento al riesgo",
				description:
					"Priorización asistida de excepciones para que contabilidad, finanzas y dirección atiendan primero lo que mueve el cierre.",
			},
		],
	},

	features: {
		tagline: "Familia de subagentes",
		headline: "Ocho funciones coordinadas por Drenyra.",
		intro:
			"Cada agente tiene un rol en el cierre: evidencia, riesgo, trazabilidad y expediente — orquestados desde un solo command center.",
		items: FEATURES_ITEMS,
	},

	workflow: {
		tagline: "Workflow",
		headline: "Drenyra propone; tu equipo decide.",
		body: "Diseñado para operar con control: asistencia, prevalidación y revisión guiada, con criterio humano en acciones sensibles.",
		steps: [
			{
				step: "01",
				title: "Ingesta y prevalidación",
				description:
					"Comprobantes, SIRE y fuentes documentales entran con contexto operativo.",
			},
			{
				step: "02",
				title: "Priorización de riesgo",
				description:
					"Vigila y Reporta ordenan excepciones por impacto antes del cierre.",
			},
			{
				step: "03",
				title: "Revisión humana",
				description:
					"Acciones sensibles esperan aprobación con evidencia visible en el workspace.",
			},
			{
				step: "04",
				title: "Expediente auditable",
				description:
					"Archiva conserva bitácora, TraceId y referencias temporales exportables.",
			},
		],
	},

	surfaces: {
		tagline: "Superficies conectadas",
		headline: "El mismo command center donde trabaja tu equipo.",
		items: [
			{
				title: "Drenyra Workspace",
				description:
					"Inbox de cierre, agentes y compuertas en una vista unificada para operadores fiscales.",
				hint: "command center",
			},
			{
				title: "Drenyra Contabilidad",
				description:
					"Asientos, estados de revisión y trazas contables alimentan el contexto de cada decisión.",
				hint: "accounting control",
			},
			{
				title: "Drenyra API",
				description:
					"Integraciones con sistemas existentes, automatizaciones y flujos personalizados.",
				hint: "developers",
			},
		],
	},

	useCases: {
		tagline: "Casos de uso · Perú",
		headline: "Contadores y empresas que viven SUNAT cada mes.",
		items: [
			{
				title: "Estudio contable multi-RUC",
				description:
					"Gestión por cliente, IGV, detracciones y SIRE con aprobaciones visibles y expediente por RUC.",
			},
			{
				title: "Retail y distribución",
				description:
					"Alto volumen de CPE, cierre mensual por sede y conciliación SIRE vs comprobantes propios.",
			},
			{
				title: "Fintech y servicios",
				description:
					"Integraciones API, validación de RUC, controles de riesgo y trazabilidad exportable para auditoría.",
			},
			{
				title: "Dirección financiera",
				description:
					"Señales de cierre, proyección pre-IGV y resumen ejecutivo sin perder el detalle operativo.",
			},
		],
	},

	quotes: {
		tagline: "Equipos fiscales",
		headline: "Control operativo sin perder velocidad.",
		items: [
			{
				quote:
					"Drenyra nos devolvió visibilidad en el cierre: sabemos qué excepción importa y quién aprobó cada exportación sensible.",
				role: "Líder de contabilidad",
				org: "Retail multi-sede",
			},
			{
				quote:
					"Los subagentes no reemplazan al equipo — ordenan el trabajo y dejan evidencia lista para auditoría interna.",
				role: "Socio de servicios",
				org: "Estudio contable",
			},
		],
	},

	trustBadges: {
		tagline: "Controles de confianza",
		items: [
			{
				title: "Prevalidación asistida",
				description:
					"Validaciones previas y propuestas guiadas antes de enviar o declarar.",
			},
			{
				title: "Aprobación humana",
				description:
					"Compuertas para acciones sensibles con registro de quién aprobó y por qué.",
			},
			{
				title: "Trazabilidad completa",
				description:
					"Bitácora exportable por decisión con evidencia asociada y referencia temporal.",
			},
		],
	},

	commandDesk: {
		tagline: "Command desk",
		headline: "Centro de control multi-RUC",
		subhead:
			"Salud fiscal ejecutiva a la izquierda, traza de auditoría en vivo a la derecha — complejidad destilada.",
		rucSelector: {
			label: "Empresa activa",
			shortcut: "Ctrl+K",
			companies: [
				{ id: "2060", label: "Retail Andes S.A.C.", ruc: "20601234567", active: true },
				{ id: "2011", label: "Logística Norte E.I.R.L.", ruc: "20119876543", active: false },
				{ id: "2055", label: "Fintech Pacífico S.A.", ruc: "20555678901", active: false },
			] as const,
		},
		compliance: {
			tagline: "Salud fiscal",
			cards: [
				{
					status: "review" as const,
					title: "Inconsistencias detectadas",
					metric: "3 excepciones IGV",
					detail: "SIRE vs comprobantes propios — priorizadas por Vigila",
				},
				{
					status: "pending" as const,
					title: "Pendiente de envío",
					metric: "RVIE · Q2",
					detail: "Registros listos — compuerta humana abierta",
				},
				{
					status: "ok" as const,
					title: "Conciliado",
					metric: "1,245 CPE",
					detail: "Eviden · matched con OSE y bancos",
				},
			] as const,
		},
		cashflow: {
			title: "Proyección pre-cierre",
			caption: "IGV e renta estimados antes del cierre mensual (ilustrativo)",
			seriesLabel: "IGV estimado",
			points: [42, 48, 45, 52, 58, 55, 62, 68] as const,
		},
		auditStream: {
			title: "Núcleo de auditoría",
			version: "drenyra-sh · v1.0",
			steps: [
				{ message: "Procesando XML SUNAT (lote 48)", meta: "ingest", done: true },
				{ message: "Validando firma digital y cadena OSE", meta: "crypto", done: true },
				{ message: "Contrastando RVIE con comprobantes propios", meta: "sire", done: true },
				{ message: "Detectando divergencias de IGV", meta: "vigia", done: false },
				{ message: "Esperando aprobación humana", meta: "gate", done: false },
			] as const,
		},
		contextEditor: {
			title: "Editor de contexto",
			placeholder: "Consultá al motor: «¿Qué CPE faltan en SIRE para este RUC?»",
			hint: "Arrastrá XML, ZIP o PDF — prevalidación asistida",
		},
	},

	stats: {
		tagline: "Señales operativas",
		items: [
			{
				value: "Evidencia",
				label: "Expediente fiscal",
				sublabel: "Documentos, reglas y aprobaciones vinculadas",
			},
			{
				value: "Riesgo",
				label: "Priorización asistida",
				sublabel: "Alertas ordenadas por impacto operativo",
			},
			{
				value: "Control",
				label: "Aprobación humana",
				sublabel: "Compuertas antes de acciones sensibles",
			},
			{
				value: "Trazabilidad",
				label: "TraceId y bitácora",
				sublabel: "Registro exportable para revisión",
			},
		],
	},

	pricing: {
		tagline: "Precios",
		headline: "Planes claros para escalar Drenyra con tu operación.",
		subhead:
			"Estilo transparente: sin letra chica en compuertas humanas ni trazabilidad. Precios orientativos — confirmar con ventas.",
		disclaimer:
			"Montos en soles (PEN). Incluyen actualizaciones de cumplimiento SUNAT. Ver planes completos en /precios.",
		plans: [
			{
				name: "Esencial",
				description: "Un RUC, equipo pequeño, agente Drenyra en cierre mensual.",
				price: "S/149",
				period: "/mes",
				features: [
					"Drenyra workspace + 3 subagentes activos",
					"Hasta 500 CPE/mes",
					"Compuerta humana básica",
					"Soporte email",
				],
				cta: "Probar gratis",
				href: "/demo",
				popular: false,
			},
			{
				name: "Pro",
				description: "Negocios en crecimiento con SIRE y control fiscal.",
				price: "S/249",
				period: "/mes",
				features: [
					"8 subagentes coordinados",
					"Hasta 3 RUCs",
					"SIRE · RVIE · detracciones",
					"Soporte prioritario",
				],
				cta: "Probar Drenyra Gratis",
				href: "/demo",
				popular: true,
			},
			{
				name: "Scale",
				description: "Alto volumen, API y gobierno fiscal enterprise.",
				price: "S/1,199",
				period: "/mes",
				features: [
					"Command desk ilimitado",
					"RUCs y usuarios sin tope contractual",
					"API + SSO",
					"Soporte dedicado",
				],
				cta: "Hablar con ventas",
				href: "/demo",
				popular: false,
			},
		],
	},

	pricingCTA: {
		tagline: "Inversión",
		headline: "Entra rápido a Drenyra y escala con gobierno fiscal real.",
		subhead:
			"El retorno viene de menos retrabajo, menos riesgo operativo y mayor claridad para auditoría y dirección.",
		ctaPrimary: "Probar Drenyra Gratis",
		ctaPrimaryHref: "/demo",
		ctaSecondary: "Ver planes completos",
		ctaSecondaryHref: "/precios",
	},
};
