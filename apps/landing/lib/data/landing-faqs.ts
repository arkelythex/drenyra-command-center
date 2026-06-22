/**
 * FAQs compartidas entre la landing v2 y JSON-LD.
 */

export interface LandingFaqItem {
	readonly category: string;
	readonly iconKey: string;
	readonly question: string;
	readonly answer: string;
}

export const LANDING_FAQS: readonly LandingFaqItem[] = [
	{
		category: "Alcance",
		iconKey: "zap",
		question: "¿Qué parte del flujo cubre Arkelythex hoy?",
		answer:
			"La entrada prioritaria es SIRE + facturación electrónica, con validaciones, estados explícitos y trazabilidad para cierre contable. Los módulos de expansión (inventario, contabilidad extendida, analítica y API avanzada) se activan por etapa según plan, volumen y necesidad operativa.",
	},
	{
		category: "Cumplimiento",
		iconKey: "shield",
		question: "¿Arkelythex garantiza aprobación SUNAT al 100%?",
		answer:
			"No ofrecemos garantías absolutas. Arkelythex reduce riesgo con validaciones previas, alertas, evidencia operativa y revisión humana donde corresponde. La aprobación final depende de SUNAT/OSE/PSE, calidad de datos y reglas vigentes por fecha y tipo de contribuyente.",
	},
	{
		category: "SIRE",
		iconKey: "database",
		question: "¿Cómo ayuda con RVIE/RCE y cierre mensual?",
		answer:
			"Centraliza compras/ventas, detecta inconsistencias y organiza la revisión antes del envío. El objetivo es pasar de 3–4 herramientas desconectadas y horas manuales de reconciliación a un flujo con estados explícitos, acciones guiadas y decisiones trazables.",
	},
	{
		category: "Evidencia",
		iconKey: "sparkles",
		question: "¿Qué evidencia entrega para auditoría?",
		answer:
			"Cada expediente puede incluir traceId, fuentes, diff de cambios, estado de decisión, responsable y bitácora exportable. Esto fortalece revisiones internas y respuesta ante fiscalización.",
	},
	{
		category: "Implementación",
		iconKey: "users",
		question: "¿Cuánto tarda implementar en empresa o estudio contable?",
		answer:
			"Depende de volumen, calidad de datos, régimen operativo e integraciones. En escenarios estándar, la activación inicial puede ser rápida; en carteras multi-RUC o contextos complejos se recomienda despliegue faseado con acompañamiento y prioridades definidas por riesgo.",
	},
	{
		category: "Soporte",
		iconKey: "message",
		question: "¿Cómo se gestiona cambios normativos y soporte operativo?",
		answer:
			"El equipo mantiene seguimiento normativo y ajustes de reglas por versión, evitando simplificaciones regulatorias imprecisas. Además, brindamos soporte en español para onboarding, operación diaria y resolución de incidencias de cumplimiento.",
	},
] as const;
