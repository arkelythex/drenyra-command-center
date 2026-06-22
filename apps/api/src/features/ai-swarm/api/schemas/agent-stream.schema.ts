/**
 * Agent stream schemas
 *
 * Zod schemas, types, and constants for agent stream endpoints
 *
 * @module ai-swarm/api/schemas/agent-stream
 */

import { t } from "elysia";
import type { InvoiceWorkflowAgentId } from "../../workflows/mastra-invoice-processing.workflow";

export const AgentStreamQuerySchema = t.Object({
	orgId: t.Optional(t.String()),
	documentId: t.Optional(t.String()),
	filename: t.Optional(t.String()),
	mimeType: t.Optional(t.String()),
	ruc: t.Optional(t.String()),
	serie: t.Optional(t.String()),
	numero: t.Optional(t.String()),
	fecha: t.Optional(t.String()),
	moneda: t.Optional(
		t.Union([t.Literal("PEN"), t.Literal("USD"), t.Literal("EUR")]),
	),
	subtotal: t.Optional(t.String()),
	igv: t.Optional(t.String()),
	total: t.Optional(t.String()),
});

export type AgentRuntimeStatus = "running" | "completed" | "failed";

export const AGENT_LABELS: Record<InvoiceWorkflowAgentId, string> = {
	lector: "Lector",
	validador: "Validador",
	arbitro: "Arbitro",
};

export const AGENT_MESSAGES: Record<
	InvoiceWorkflowAgentId,
	{ start: string; complete: string; failed: string }
> = {
	lector: {
		start: "Extrayendo y normalizando datos del comprobante.",
		complete: "Datos base de la factura listos para validación.",
		failed: "No se pudieron extraer datos consistentes del comprobante.",
	},
	validador: {
		start: "Ejecutando validación SUNAT híbrida.",
		complete: "Validación SUNAT completada.",
		failed: "Falló la validación SUNAT del documento.",
	},
	arbitro: {
		start: "Determinando decisión final del flujo.",
		complete: "Decisión final emitida.",
		failed: "No se pudo resolver la decisión final del árbitro.",
	},
};
