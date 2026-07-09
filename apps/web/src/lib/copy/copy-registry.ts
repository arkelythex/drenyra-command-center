/**
 * Central Registry de Copy — Drenyra
 *
 * Fuente única de verdad para todo texto visible en la interfaz.
 * Vocabulario contable obligatorio: ni Git, ni ingeniería, ni inglés sin traducción.
 *
 * Reglas:
 * - Todo string visible al usuario SALE de acá, nunca hardcodeado en componentes.
 * - Si un string cambia, se cambia ACÁ, no en 15 componentes distintos.
 * - Idioma: español. Solo excepciones documentadas explícitamente abajo.
 */

export const COPY = {
	// ─── Navegación ───────────────────────────────────────────────────
	nav: {
		workspace: "Panel de trabajo",
		explorer: "Explorador de comprobantes",
		periods: "Periodos",
		cases: "Casos",
		settings: "Configuración",
	},

	// ─── Header / Top Bar ─────────────────────────────────────────────
	header: {
		runAnalysis: "Analizar periodo",
		export: "Exportar",
		exportPdf: "PDF",
		exportExcel: "Excel",
		pendingEntries: "Pendientes",
		period: "Período",
	},

	// ─── Editor de asientos ────────────────────────────────────────────
	journal: {
		title: "Editor de asientos",
		accept: "Aceptar",
		reject: "Rechazar",
		edit: "Editar",
		pending: "Pendiente",
		approved: "Aprobado",
		rejected: "Rechazado",
		noEntries: "No hay asientos propuestos para este periodo.",
	},

	// ─── Terminal del agente ──────────────────────────────────────────
	agent: {
		title: "Terminal del agente",
		placeholder: "Preguntale algo al agente fiscal...",
		close: "Cerrar",
		processing: "Analizando...",
		ready: "Listo para revisar",
		noMessages: "Todavía no hay mensajes. Iniciá una conversación.",
		send: "Enviar",
		sendHint: "Enter para enviar",
	},

	// ─── Estados ──────────────────────────────────────────────────────
	state: {
		loading: "Cargando...",
		error: "Ocurrió un error inesperado.",
		errorAction: "Reintentar",
		empty: "No hay datos disponibles.",
		emptyAction: "Empezar",
		noPeriod: "No hay un periodo fiscal seleccionado.",
		selectPeriod: "Seleccionar periodo",
		noPeriodDescription:
			"Drenyra necesita un periodo fiscal explícito (AAAA-MM) para funcionar.",
	},

	// ─── Periodo ──────────────────────────────────────────────────────
	period: {
		selectTitle: "Seleccionar periodo fiscal",
		formatHint: "Formato: AAAA-MM",
		current: "Periodo actual",
		close: "Cerrar periodo",
	},

	// ─── Export ───────────────────────────────────────────────────────
	exports: {
		title: "Exportar",
		pdf: "PDF",
		excel: "Excel",
		csv: "CSV",
	},

	// ─── Errores ──────────────────────────────────────────────────────
	error: {
		noFiscalPeriod: {
			title: "Periodo fiscal no seleccionado",
			message:
				"Drenyra necesita un periodo fiscal explícito (AAAA-MM) para funcionar.",
			action: "Seleccionar periodo",
		},
		networkError: {
			title: "Error de conexión",
			message:
				"No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.",
			action: "Reintentar",
		},
		generic: {
			title: "Algo salió mal",
			message:
				"Ocurrió un error inesperado. Si el problema persiste, contactá a soporte.",
			action: "Reintentar",
		},
	},
} as const;

export type CopyKey = keyof typeof COPY;
