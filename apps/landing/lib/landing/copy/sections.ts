/**
 * Bloques narrativos del cuerpo de la landing v2 (entre trust y cierre).
 *
 * @see docs/features-index.md — precedencia de features montadas.
 * @see docs/03-features/README.md — inventario API activa vs backlog.
 * @see docs/concepts/sunat-regulations-2026.md — SIRE/CPE/PLE y transmisión.
 * @see docs/products/drenyra.md — superficies.
 * @see docs/business/claim-register-2026.md
 */

export const sectionsCopy = {
	howItWorks: {
		tagline: "Cómo funciona",
		headline:
			"De la integración a la evidencia, con ejecución fiscal verificable.",
		subhead:
			"La lógica es simple: conectar, procesar, revisar y exportar. Drenyra maneja la complejidad; vos tomás las decisiones.",
		steps: [
			{
				title: "1. Conecta",
				description:
					"Integrá tus fuentes documentales, bancos y datos SUNAT. Drenyra captura todo desde el origen digital sin errores de transcripción.",
			},
			{
				title: "2. Procesa",
				description:
					"8 agentes IA analizan comprobantes, conciliaciones y registros SIRE. Prevalidación automática antes del envío.",
			},
			{
				title: "3. Revisa",
				description:
					"Evidencia, diff y trazabilidad visibles para que vos apruebes con criterio y seguridad. Compuertas humanas en acciones sensibles.",
			},
			{
				title: "4. Exporta",
				description:
					"Expediente auditable con TraceId, bitácora y fuentes documentales. Listo para auditoría interna o externa.",
			},
		] as const,
	},

	capabilities: {
		tagline: "Radar Fiscal",
		headline: "El dashboard que abre con lo que importa hoy.",
		subhead:
			"Riesgo fiscal, estado SIRE, vencimientos SUNAT, conciliación bancaria. No dashboards genéricos: radar operativo con prioridad crítica.",
		proofLine: [
			"Un sistema",
			"Siempre activo",
			"Revisión humana garantizada",
		] as const,
		items: [
			{
				title: "Facturación electrónica",
				description:
					"Emisión y validación estructural de comprobantes con seguimiento de estado CDR.",
			},
			{
				title: "Conciliación bancaria",
				description:
					"Cruce de movimientos y partidas para cierres defendibles; alcance según integración e institución.",
			},
			{
				title: "Motor tributario",
				description:
					"Reglas de IGV, retenciones y controles de consistencia por periodo.",
			},
			{
				title: "Revisión de riesgos",
				description:
					"Alertas priorizadas por impacto para actuar antes de declarar.",
			},
			{
				title: "Expedientes fiscales",
				description:
					"Evidencia por periodo con trazabilidad completa de decisiones.",
			},
			{
				title: "Reportes en tiempo real",
				description:
					"Visibilidad compartida para contador, administrador y dirección.",
			},
			{
				title: "Trazabilidad audit-ready",
				description:
					"Bitácora exportable de cambios, aprobaciones y responsable operativo.",
			},
		] as const,
	},

	pillars: {
		tagline: "Plataforma Integral",
		headline:
			"Drenyra es el centro de comando para operar, revisar y auditar empresas peruanas.",
		headlineEmphasis:
			"La IA aparece en cada flujo crítico: facturación, compras, conciliación, SIRE, cierre y auditoría.",
		autonomyNote:
			"Nivel 0-5: la IA propone, el sistema valida, el contador aprueba, Drenyra deja evidencia.",
		subhead:
			"Drenyra integra contabilidad, gestión de estudios, análisis fiscal y SIRE en una sola plataforma. No son módulos separados — son partes de un mismo sistema inteligente.",
		flagship: {
			key: "drenyra" as const,
			name: "Drenyra",
			description:
				"Plataforma integral de contabilidad inteligente. 8 agentes IA especializados procesan, validan y dejan evidencia completa. Vos revisás y aprobás.",
			outcome:
				"Decisiones con respaldo de IA. Cada alerta tiene un porqué, cada regla es auditable.",
			features: [
				"Contabilidad operativa",
				"Gestión de estudios",
				"Análisis fiscal",
				"SIRE + facturación",
			] as const,
			icpLabel: "Todos los usuarios Drenyra",
			ctaLabel: "Conocer Drenyra",
			ctaHref: "/drenyra",
		},
		agentEcosystem: {
			label: "8 Agentes IA",
			description: "La IA no es un módulo. Es una capa operativa transversal.",
			agents: [
				{
					name: "Bookkeeping Agent",
					description: "Automatización de asientos y conciliación diaria",
				},
				{
					name: "Finance Agent",
					description: "Análisis financiero y proyecciones",
				},
				{
					name: "Reporting Agent",
					description: "Generación de reportes y estados financieros",
				},
				{
					name: "SIRE Agent",
					description: "Preparación y seguimiento de registros SUNAT",
				},
				{
					name: "Compliance Agent",
					description: "Validaciones cruzadas con reglas SUNAT",
				},
				{
					name: "Reconciliation Agent",
					description: "Conciliación bancaria automática",
				},
				{
					name: "Document Agent",
					description: "Procesamiento de comprobantes y evidencia",
				},
				{
					name: "Analytics Agent",
					description: "Análisis de riesgo y priorización",
				},
			],
		},
		modules: [] as const,
	},

	peru: {
		tagline: "Diseñado para Perú",
		headlineLead: "Perú-first,",
		headlineAccent: "compliance operativo real.",
		description:
			"Producto diseñado para contexto local: calendario fiscal, lenguaje contable peruano, reglas vigentes por fecha/tipo de contribuyente y operación multi-RUC bajo la misma vista de riesgo.",
		transmissionTitle: "Estado de transmisión",
		transmissionFootnote:
			"Ejemplo de interfaz. Los estados dependen de SUNAT/OSE/PSE y condiciones de red.",
		rows: ["OPE-2026-001", "OPE-2026-002", "OPE-2026-003"] as const,
		rowStatus: "Ejemplo · tramitado",
		points: [
			{
				key: "sunat" as const,
				title: "Calendario y operación local",
				description:
					"La prioridad fiscal peruana vive en el producto, no en una planilla externa.",
			},
			{
				key: "sire" as const,
				title: "Empresa + contador alineados",
				description:
					"Un único circuito de revisión y aprobación para reducir reprocesos.",
			},
			{
				key: "guias" as const,
				title: "Escala multi-RUC",
				description:
					"Gestión de cartera y expedientes sin duplicar maestros ni romper trazabilidad.",
			},
			{
				key: "retention" as const,
				title: "Preparado para auditoría",
				description:
					"Evidencia estructurada para fiscalización interna o requerimientos externos.",
			},
		] as const,
		pipelineTagline: "Capacidades operativas",
		pipelineHeadline: "Pipeline técnico: emisión, registros y conciliación.",
		pipelineSubhead:
			"Capa de producto (no de marketing): cómo Arkelythex conecta comprobantes, libros y bancos en una operación trazable.",
		pipelineItems: [
			{
				id: "sire" as const,
				title: "SIRE y registros",
				summary: "Preparación y seguimiento de RVIE/RCE en flujo de cierre.",
				detail:
					"Alineación de compras/ventas y validaciones previas al envío o exportación según proceso y calendario fiscal. La presentación al portal SUNAT puede ser manual según despliegue e integraciones acordadas.",
			},
			{
				id: "cpe" as const,
				title: "Comprobantes electrónicos",
				summary:
					"Emisión y validación estructural (UBL) con trazabilidad de estado.",
				detail:
					"Facturas, notas y documentos relacionados con visibilidad desde emisión hasta respuesta.",
			},
			{
				id: "ple" as const,
				title: "Libros electrónicos",
				summary:
					"Control de periodos y consistencia para cierre contable defendible.",
				detail:
					"Gestión de libros y anexos con evidencia lista para revisión o transmisión.",
			},
			{
				id: "bancos" as const,
				title: "Bancos y conciliación",
				summary:
					"Cruce de movimientos para detectar diferencias antes de declarar.",
				detail:
					"Conciliación asistida; conectividad y alcance dependen de institución y roadmap de integración.",
			},
		] as const,
		securityTitle: "Seguridad y soberanía",
		securityItems: [
			{
				title: "Cifrado y control de acceso",
				detail:
					"Controles de seguridad en tránsito y reposo con segmentación por roles y permisos.",
			},
			{
				title: "Cumplimiento y roadmap",
				detail:
					"Controles operativos documentados; certificaciones formales según plan de madurez.",
			},
			{
				title: "Soberanía y despliegue",
				detail:
					"Opciones de despliegue y residencia de datos según requerimientos del cliente.",
			},
			{
				title: "Continuidad operativa",
				detail:
					"Estrategia de respaldo y recuperación para minimizar interrupciones de servicio.",
			},
		] as const,
	},

	demo: {
		tagline: "Ver el workspace",
		headline: "Tres estados para gobernar el cierre con precisión.",
		subhead:
			"Ejemplo de interfaz: tiempos y estados finales dependen de OSE, SUNAT y condiciones de red. Cada estado deja claro qué se detectó, qué evidencia existe y cuál es la siguiente acción operativa. Primero riesgo e impacto; después decisión y envío.",
		states: [
			{
				key: "review" as const,
				label: "En revisión",
				callout: "Se detectaron inconsistencias antes del envío.",
				detail: "Equipo valida compras/ventas vs. registro propuesto",
				metricLabel: "Impacto estimado",
				metricValue: "S/ 2,430",
				actionLabel: "Abrir expediente",
			},
			{
				key: "ready" as const,
				label: "Listo para envío",
				callout: "Validaciones completas y expediente preparado.",
				detail: "Pendiente de aprobación final del responsable",
				metricLabel: "Checks completados",
				metricValue: "12 / 12",
				actionLabel: "Programar envío",
			},
			{
				key: "accepted" as const,
				label: "Respuesta confirmada (ej.)",
				callout:
					"Estado de ejemplo tras cadena OSE/SUNAT; evidencia registrada.",
				detail:
					"Bitácora y trazabilidad actualizadas cuando el flujo lo permite",
				metricLabel: "Tiempo de resolución",
				metricValue: "— (ejemplo)",
				actionLabel: "Exportar evidencia",
			},
		] as const,
		railTitle: "Panel de riesgo fiscal: qué se ve primero",
	},

	comparison: {
		tagline: "Por qué Arkelythex",
		headline: "Menos fragmentación. Más control antes de declarar.",
		subhead:
			"Un solo sistema que prevalida, traza y gobierna el cierre. Sin hojas auxiliares, sin retrabajo manual y con evidencia operativa antes de exponer la operación.",
		rows: [
			{
				feature: "Flujo de cierre",
				arkelythex:
					"SIRE + CPE + conciliación + revisión en una misma superficie operativa.",
				legacy: "Herramientas separadas, hojas auxiliares y retrabajo manual.",
			},
			{
				feature: "Control de riesgo",
				arkelythex:
					"Alertas priorizadas, estados explícitos y aprobación humana cuando corresponde.",
				legacy: "Detección tardía y decisiones sin contexto consolidado.",
			},
			{
				feature: "Evidencia y trazabilidad",
				arkelythex:
					"TraceId, fuentes y diff por decisión; exportable para auditoría.",
				legacy: "Evidencia dispersa en correos, archivos y chats.",
			},
			{
				feature: "Adopción técnica",
				arkelythex:
					"API moderna y arquitectura cloud-native para escalar integraciones.",
				legacy: "Integraciones frágiles y dependencias legacy.",
			},
		] as const,
	},

	video: {
		tagline: "Ver el producto",
		headline: "Demo en video",
		description:
			"Recorrido breve del workspace fiscal y del flujo SIRE-first. La configuración final se ajusta en sesión guiada.",
		youtubeVideoId: "IEQOq78omc8",
	},

	testimonials: {
		tagline: "Operación real",
		headline: "Equipos que priorizan control, velocidad y evidencia.",
		subhead:
			"Casos ilustrativos: resultados dependen de proceso, volumen documental y madurez operativa.",
		proofStrip: [
			"Señales de riesgo visibles",
			"Revisión con evidencia",
			"Decisiones trazables por periodo",
		] as const,
		items: [
			{
				quote:
					"Pasamos de apagar incendios del SIRE a tener prioridad clara de riesgo por periodo.",
				author: "Ricardo B.",
				role: "CFO",
				company: "Retail industrial",
				signal: "Cierre con prioridad clara",
				impact: "Menos reacción tardía y mejor foco del equipo financiero.",
			},
			{
				quote:
					"El estudio ganó tiempo en cierres multi-RUC y mejoró la defensa ante auditoría.",
				author: "María P.",
				role: "Socia",
				company: "Estudio contable",
				signal: "Escala multi-RUC con control",
				impact: "Más capacidad operativa sin perder trazabilidad.",
			},
			{
				quote:
					"Integrar la API fiscal nos permitió acelerar entregas sin romper cumplimiento.",
				author: "Jorge L.",
				role: "CTO",
				company: "Fintech",
				signal: "Integración sin deuda fiscal extra",
				impact:
					"Más velocidad técnica con menos riesgo en emisión y validación.",
			},
		] as const,
	},

	pricingSection: {
		tagline: "Inversión",
		headline: "Planes claros para entrar rápido y escalar con control.",
		subhead:
			"Pricing comercial 2026 para validar, operar y expandir. La tesis económica se sostiene por menos retrabajo de cierre, menos horas manuales en registros e integración fiscal y mejor control del riesgo.",
	},

	/** Sección dedicada: Drenyra — plataforma integral de contabilidad inteligente */
	drenyraEngine: {
		tagline: "Drenyra by Arkelythex",
		headline: "Plataforma integral de",
		headlineEmphasis: "contabilidad inteligente.",
		subhead:
			"Drenyra centraliza facturación, conciliación, análisis fiscal y SIRE en una sola plataforma con 8 agentes IA que trabajan 24/7.",
		description:
			"Procesá comprobantes electrónicos, priorizá alertas tributarias y generá evidencia estructurada para revisión humana del equipo.",
		description2:
			"Cada sugerencia conserva contexto, fuente y siguiente acción. Las decisiones sensibles quedan bajo aprobación humana y trazabilidad.",
		ctaPrimary: "Comenzar piloto GRATIS",
		ctaPrimaryHref: "/drenyra#drenyra-pricing",
		ctaSecondary: "Ver capacidades",
		ctaSecondaryHref: "/drenyra#drenyra-modulos",
		panelItems: [
			{
				key: "detect" as const,
				title: "Comprobante F001-3921 detectado",
				detail: "Factura emitida · RUC validado · Drenyra Engine v2026.5",
				meta: "IGV detectado: S/ 184.20",
				status: "neutral" as const,
			},
			{
				key: "validate" as const,
				title: "Prevalidación asistida completa",
				detail: "IA revisó reglas SUNAT · Requiere criterio contable",
				meta: "Checks: 12 / 12",
				status: "success" as const,
			},
			{
				key: "risk" as const,
				title: "Riesgo fiscal: Bajo",
				detail: "Drenyra no encontró discrepancias con SIRE RVIE",
				meta: "Próxima acción: consolidar periodo",
				status: "success" as const,
			},
			{
				key: "evidence" as const,
				title: "Evidencia Agéntica generada",
				detail: "Drenyra registró hash + timestamp + razonamiento",
				meta: "TraceId: drenyra-2026-05-03-f001-3921",
				status: "neutral" as const,
			},
			{
				key: "approve" as const,
				title: "Aprobación pendiente",
				detail: "Drenyra espera confirmación humana · Auditable",
				meta: "Guardian mode active",
				status: "alert" as const,
			},
		] as const,
	},

	/** Tres pilares explícitos (brief “capa operativa”) — antes del bento de producto. */
	solutionLayer: {
		id: "capa-compliance",
		tagline: "Solución",
		headline: "Una capa operativa de compliance antes de la declaración.",
		subhead:
			"Vista conceptual del producto: prevalidar, trazar decisiones y actuar sobre riesgo antes de exponer la operación.",
		pillars: [
			{
				title: "Prevalidación fiscal",
				body: "Detecta inconsistencias de IGV, detracciones y comprobantes antes del cierre.",
				hint: "Ejemplo de análisis",
			},
			{
				title: "Trazabilidad de decisiones",
				body: "Estados explícitos, fuentes y bitácora para reconstruir qué se hizo y por qué.",
				hint: "Audit-ready",
			},
			{
				title: "Panel de riesgo accionable",
				body: "Prioriza divergencias por impacto y siguiente acción — menos ruido, más control.",
				hint: "Severidad clara",
			},
		] as const,
	},

	faqSection: {
		tagline: "Preguntas frecuentes",
		headline: "Lo esencial antes de decidir",
		subhead:
			"Alcance real, límites operativos y cómo minimizar riesgo sin sobrepromesas.",
		quickSignals: [
			{
				title: "Qué cubre hoy",
				detail:
					"Preparación de registros SIRE (RVIE/RCE), facturación electrónica (CPE/UBL) y evidencia operativa como entrada prioritaria; el trámite en portal SUNAT sigue el proceso del cliente salvo integraciones explícitas acordadas.",
			},
			{
				title: "Qué no promete",
				detail:
					"No ofrece aprobación absoluta; reduce riesgo con validaciones, revisión guiada y evidencia exportable.",
			},
			{
				title: "Cómo se implementa",
				detail:
					"Por etapas, según volumen documental, complejidad, tipo de contribuyente y necesidad de integración.",
			},
		] as const,
	},
} as const;
