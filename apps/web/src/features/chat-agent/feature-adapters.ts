/**
 * Feature Adapters Registry
 *
 * Cada feature registra patterns y handlers que llaman a APIs reales.
 * Si la API no está disponible, devuelve error claro en vez de mock data.
 */
import type { ChatMessage, FeatureAdapter, FeatureMatch } from "./agent-types";

const API_BASE = "http://localhost:3000/api";

let msgId = 0;
function nextId() {
	msgId++;
	return `msg-${String(msgId).padStart(4, "0")}`;
}

// ─── API helpers ─────────────────────────────────────────────────────────

async function apiPost(path: string, body?: unknown): Promise<Response> {
	return fetch(`${API_BASE}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});
}

async function apiGet(path: string): Promise<Response> {
	return fetch(`${API_BASE}${path}`);
}

function apiError(msg: string): ChatMessage {
	return {
		id: nextId(),
		role: "assistant",
		text: `⚠ **Error de conexión**\n\n${msg}\n\nAsegurate que la API esté corriendo en \`${API_BASE}\`.`,
		timestamp: new Date(),
	};
}

// ─── APPROVAL ADAPTER ────────────────────────────────────────────────────

export const APPROVAL_ADAPTER: FeatureAdapter = {
	featureId: "approval",
	label: "Aprobaciones",
	description: "Revisar y aprobar recomendaciones",
	keywords: ["aprobar", "rechazar", "recomendación", "pendiente", "rec-"],
	match: (input) => {
		let m = input.match(/^aprueba\s+(rec-\d+)/i);
		if (m)
			return {
				featureId: "approval",
				confidence: 0.95,
				params: { action: "approve", id: m[1]?.toUpperCase() },
			};
		m = input.match(/^rechaza\s+(rec-\d+)(?:\s+--motivo\s+(.+))?/i);
		if (m)
			return {
				featureId: "approval",
				confidence: 0.95,
				params: { action: "reject", id: m[1]?.toUpperCase(), motivo: m[2] },
			};
		if (/^(qué\s+)?(hay\s+)?pendientes|recomendaciones/i.test(input))
			return {
				featureId: "approval",
				confidence: 0.9,
				params: { action: "list" },
			};
		m = input.match(/(ver|detalle|mostrar|muestra)\s+(rec-\d+)/i);
		if (m)
			return {
				featureId: "approval",
				confidence: 0.9,
				params: { action: "detail", id: m[2]?.toUpperCase() },
			};
		return null;
	},
	handle: async (match) => {
		const { action, id, motivo } = match.params;

		try {
			if (action === "approve" && id) {
				const res = await apiPost(`/approval/${id}/approve`);
				if (!res.ok) {
					const err = await res.json();
					return {
						id: nextId(),
						role: "assistant",
						text: `❌ **Error al aprobar ${id}**\n\n${err.error ?? res.statusText}`,
						timestamp: new Date(),
					};
				}
				const data = (await res.json()).data;
				return {
					id: nextId(),
					role: "assistant",
					text: `✅ **${id} aprobada**\n\n${data.descripcion}\nMonto: ${data.moneda} ${data.monto.toFixed(2)}\nConfianza: ${(data.confianza * 100).toFixed(0)}%`,
					timestamp: new Date(),
					richContent: { kind: "approval-card", data },
				};
			}

			if (action === "reject" && id) {
				if (!motivo) {
					return {
						id: nextId(),
						role: "assistant",
						text: `Para rechazar necesito un motivo.\nEj: "rechaza ${id} --motivo período incorrecto"`,
						timestamp: new Date(),
					};
				}
				const res = await apiPost(`/approval/${id}/reject`, { motivo });
				if (!res.ok) {
					const err = await res.json();
					return {
						id: nextId(),
						role: "assistant",
						text: `❌ **Error al rechazar ${id}**\n\n${err.error ?? res.statusText}`,
						timestamp: new Date(),
					};
				}
				return {
					id: nextId(),
					role: "assistant",
					text: `❌ **${id} rechazada**\n\nMotivo: ${motivo}\n\nAcción NO ejecutada.`,
					timestamp: new Date(),
				};
			}

			if (action === "detail" && id) {
				const res = await apiGet(`/approval/${id}`);
				if (!res.ok) {
					return {
						id: nextId(),
						role: "assistant",
						text: `No encontré ${id}.`,
						timestamp: new Date(),
					};
				}
				const rec = (await res.json()).data;
				return {
					id: nextId(),
					role: "assistant",
					text: `📋 **${rec.id}**\n\n${rec.descripcion}\nRUC: ${rec.ruc}\nPeríodo: ${rec.periodo}\nMonto: ${rec.moneda} ${rec.monto.toFixed(2)}\nConfianza: ${(rec.confianza * 100).toFixed(0)}%\nEstado: ${rec.status}`,
					timestamp: new Date(),
				};
			}

			// List pending
			const res = await apiGet("/approval/pending");
			if (!res.ok) {
				return {
					id: nextId(),
					role: "assistant",
					text: "No se pudieron cargar las recomendaciones.",
					timestamp: new Date(),
				};
			}
			const data = (await res.json()).data;
			const pending =
				data.recommendations?.filter((r: any) => r.status === "pending") ?? [];
			if (pending.length === 0) {
				return {
					id: nextId(),
					role: "assistant",
					text: "No hay recomendaciones pendientes. Hacé una consulta fiscal para generar nuevas.",
					timestamp: new Date(),
				};
			}
			return {
				id: nextId(),
				role: "assistant",
				text: `📋 **${pending.length} pendiente(s)**\n\nUsá "aprueba REC-001" o "rechaza REC-001 --motivo ..."`,
				timestamp: new Date(),
				richContent: { kind: "approval-list", data: pending },
			};
		} catch {
			return apiError("No se pudo conectar con el servidor de aprobaciones.");
		}
	},
};

// ─── SKILLS ADAPTER ──────────────────────────────────────────────────────

const SAMPLE_SKILLS = [
	{
		name: "Fiscal Query",
		desc: "Consultar IGV, detracciones, SIRE",
		status: "active",
	},
	{
		name: "Approval Manager",
		desc: "Aprobar/rechazar recomendaciones",
		status: "active",
	},
	{
		name: "Compliance Pipeline",
		desc: "Ejecutar pipeline SDD fiscal",
		status: "active",
	},
	{ name: "SIRE Reporter", desc: "Generar reportes SIRE", status: "active" },
	{ name: "RUC Validator", desc: "Validar alcance RUC", status: "active" },
];

export const SKILLS_ADAPTER: FeatureAdapter = {
	featureId: "skills",
	label: "Skills",
	description: "Skills disponibles",
	keywords: [
		"skill",
		"skills",
		"qué sabes hacer",
		"qué podes hacer",
		"ayuda",
		"capacidades",
	],
	match: (input) => {
		if (
			[
				/skills/i,
				/capacidades/i,
				/ayuda/i,
				/qué sabes hacer/i,
				/qué podes hacer/i,
			].some((p) => p.test(input))
		)
			return {
				featureId: "skills",
				confidence: 0.85,
				params: { action: "list" },
			};
		return null;
	},
	handle: async () => ({
		id: nextId(),
		role: "assistant",
		text: `🛠️ **Skills disponibles (${SAMPLE_SKILLS.length})**\n\nPodés consultar IGV, detracciones, SIRE, aprobar recomendaciones, ejecutar automatizaciones y más.\n\nTodo desde lenguaje natural.`,
		timestamp: new Date(),
		richContent: { kind: "skill-list", data: SAMPLE_SKILLS },
	}),
};

// ─── AUTOMATIONS ADAPTER ─────────────────────────────────────────────────

const SAMPLE_AUTOMATIONS = [
	{
		name: "Cierre Mensual",
		desc: "Pipeline de cierre del período",
		schedule: "Cada 1er día del mes",
		status: "active",
	},
	{
		name: "SIRE Auto-Report",
		desc: "Genera y envía reporte SIRE",
		schedule: "Semanal (lunes)",
		status: "active",
	},
	{
		name: "Detracciones Check",
		desc: "Verifica detracciones pendientes",
		schedule: "Diario",
		status: "paused",
	},
];

export const AUTOMATIONS_ADAPTER: FeatureAdapter = {
	featureId: "automations",
	label: "Automatizaciones",
	description: "Gestionar y ejecutar pipelines",
	keywords: [
		"automatización",
		"automation",
		"pipeline",
		"programar",
		"cierre",
		"mensual",
	],
	match: (input) => {
		if (
			/(automatizacion|automation|pipeline|programar|cierre mensual)/i.test(
				input,
			)
		)
			return {
				featureId: "automations",
				confidence: 0.8,
				params: { action: "list" },
			};
		return null;
	},
	handle: async () => ({
		id: nextId(),
		role: "assistant",
		text: `⚡ **Automatizaciones (${SAMPLE_AUTOMATIONS.length})**\n\nEjecutá pipelines automáticos con lenguaje natural.\n\n- "ejecuta cierre mensual"\n- "pausa detracciones check"`,
		timestamp: new Date(),
		richContent: { kind: "automation-list", data: SAMPLE_AUTOMATIONS },
	}),
};

// ─── FEATURES ADAPTER ────────────────────────────────────────────────────

const SAMPLE_FEATURES = [
	{
		id: "consulta",
		label: "Consulta Fiscal",
		desc: "IGV, detracciones, SIRE, retenciones",
	},
	{
		id: "approval",
		label: "Aprobaciones",
		desc: "Revisar y aprobar recomendaciones",
	},
	{
		id: "automations",
		label: "Automatizaciones",
		desc: "Ejecutar y gestionar pipelines",
	},
	{ id: "skills", label: "Skills", desc: "Skills disponibles del sistema" },
	{ id: "compliance", label: "Compliance", desc: "SIRE, SUNAT, detracciones" },
	{ id: "reports", label: "Reportes", desc: "Reportes fiscales y contables" },
];

export const FEATURES_ADAPTER: FeatureAdapter = {
	featureId: "features",
	label: "Features",
	description: "Descubrir capacidades de Drenyra",
	keywords: [
		"funcionalidades",
		"features",
		"qué puedo hacer",
		"dónde",
		"menú",
		"todo",
	],
	match: (input) => {
		if (
			/(funcionalidades|features|qu[eé] puedo hacer|d[oó]nde|men[úu]|todo)/i.test(
				input,
			)
		)
			return {
				featureId: "features",
				confidence: 0.8,
				params: { action: "list" },
			};
		return null;
	},
	handle: async () => ({
		id: nextId(),
		role: "assistant",
		text: `📌 **Drenyra — Centro de Comando**\n\nTodo se maneja desde este chat:\n\n${SAMPLE_FEATURES.map((f) => `- **${f.label}**: ${f.desc}`).join("\n")}\n\nProbá escribiendo lo que necesitás en lenguaje natural.`,
		timestamp: new Date(),
		richContent: { kind: "feature-grid", data: SAMPLE_FEATURES },
	}),
};

// ─── CONSULTA ADAPTER (catch-all: llama a API real) ─────────────────────

export const FISCAL_CONSULTA_ADAPTER: FeatureAdapter = {
	featureId: "consulta",
	label: "Consulta Fiscal",
	description: "IGV, detracciones, SIRE, retenciones",
	keywords: [
		"igv",
		"impuesto",
		"detracción",
		"sire",
		"retención",
		"factura",
		"consulta",
	],
	match: (input) => {
		// Catch-all: cualquier texto que no matcheó otro adapter
		return { featureId: "consulta", confidence: 0.3, params: { query: input } };
	},
	handle: async (match) => {
		const query = match.params.query ?? "";
		try {
			// Try API first
			const res = await apiPost("/consulta", { texto: query, output: "json" });
			if (res.ok) {
				const data = (await res.json()).data;
				return {
					id: nextId(),
					role: "assistant",
					text: `📊 **${getTipoLabel(data.tipo)} — ${data.periodo || ""}**\n\nRUC: ${data.ruc || "—"}\nConfianza: ${(data.confianza * 100).toFixed(0)}%\n📎 ${data.fuentes?.length ?? 0} fuente(s)`,
					timestamp: new Date(),
					richContent:
						data.kind === "consulta-result"
							? { kind: "consulta-result", data: data.resultado ?? {} }
							: undefined,
				};
			}

			// API responded with error
			const err = await res.json();
			return {
				id: nextId(),
				role: "assistant",
				text: `⚠ **Consulta no procesada**\n\n${err.error ?? "La API no pudo procesar la consulta."}\n\nProbá con: "qué sabes hacer" para ver las opciones disponibles.`,
				timestamp: new Date(),
			};
		} catch {
			return apiError(`No se pudo conectar con la API.`);
		}
	},
};

function getTipoLabel(tipo: string): string {
	const labels: Record<string, string> = {
		"igv-consulta": "IGV",
		"detracciones-consulta": "Detracciones",
		"sire-resumen": "SIRE",
		"retenciones-consulta": "Retenciones",
		"pipeline-run": "Pipeline",
		"factura-lookup": "Documento",
		unknown: "Consulta",
	};
	return labels[tipo] ?? "Consulta Fiscal";
}

// ─── Registry ───────────────────────────────────────────────────────────

export const FEATURE_REGISTRY: FeatureAdapter[] = [
	APPROVAL_ADAPTER,
	SKILLS_ADAPTER,
	AUTOMATIONS_ADAPTER,
	FEATURES_ADAPTER,
	FISCAL_CONSULTA_ADAPTER, // catch-all
];

export function findBestAdapter(
	input: string,
): { adapter: FeatureAdapter; match: FeatureMatch } | null {
	let best: { adapter: FeatureAdapter; match: FeatureMatch } | null = null;
	for (const adapter of FEATURE_REGISTRY) {
		const match = adapter.match(input);
		if (match && (!best || match.confidence > best.match.confidence)) {
			match.featureId = adapter.featureId;
			best = { adapter, match };
		}
	}
	return best;
}
