/**
 * Consulta — Natural Language Fiscal Query API
 *
 * POST /api/consulta
 * Accepts natural language fiscal queries, classifies intent,
 * routes to the appropriate pipeline or data source, and returns
 * structured results with evidence artifacts.
 */

import type { QueryInput } from "@drenyra/fiscal-query-engine";
import {
	buildErrorResponse,
	buildQueryResult,
	classifyQuery,
	routeIntent,
} from "@drenyra/fiscal-query-engine";
import { Elysia, t } from "elysia";

// ─── Schemas ───────────────────────────────────────────────────────────

const ConsultaInputSchema = t.Object({
	texto: t.String({
		minLength: 1,
		description: "Natural language query text",
		examples: [
			"IGV de julio 2026",
			"detracciones pendientes",
			"resumen SIRE del período",
		],
	}),
	ruc: t.Optional(
		t.String({
			pattern: "^\\d{11}$",
			description: "RUC (11 dígitos)",
		}),
	),
	periodo: t.Optional(
		t.String({
			pattern: "^\\d{4}-\\d{2}$",
			description: "Período en formato YYYY-MM",
		}),
	),
	modo: t.Optional(
		t.Union([
			t.Literal("auto"),
			t.Literal("interactive"),
			t.Literal("supervised"),
		]),
	),
	output: t.Optional(t.Union([t.Literal("text"), t.Literal("json")])),
});

const ConsultaResponseSchema = t.Object({
	ok: t.Boolean(),
	data: t.Optional(t.Any()),
	error: t.Optional(t.String()),
});

// ─── Module Builder ─────────────────────────────────────────────────────

interface ConsultaModuleDeps {
	classifyFn?: typeof classifyQuery;
	routeFn?: typeof routeIntent;
}

export function buildConsultaModule(deps: ConsultaModuleDeps = {}) {
	const classify = deps.classifyFn ?? classifyQuery;
	const route = deps.routeFn ?? routeIntent;

	return new Elysia({ prefix: "/api/consulta" }).post(
		"/",
		async ({ body, set }) => {
			const input: QueryInput = {
				texto: body.texto,
				ruc: body.ruc,
				periodo: body.periodo,
				modo: body.modo ?? "auto",
				output: body.output ?? "text",
			};

			// 1. Classify the query
			const classification = await classify(input);

			// 2. Handle ambiguous queries
			if (
				classification.kind === "unknown" ||
				classification.confidence < 0.3
			) {
				const suggestions =
					"suggestions" in classification
						? (classification as any).suggestions
						: undefined;

				const result = buildErrorResponse(
					classification,
					"No se pudo determinar la consulta.",
					suggestions?.join("\n"),
				);

				set.status = 400;
				return {
					ok: false,
					data: result,
					error:
						"Consulta no reconocida. Incluí RUC, período y tipo de consulta.",
				};
			}

			// 3. Route the intent
			const pipelineRoute = route(classification);

			// 4. Build response (pipeline execution deferred — returns classification + route)
			const result = buildQueryResult(classification, {
				pipelineRoute,
			} as unknown as Record<string, unknown>);

			return {
				ok: true,
				data: result,
			};
		},
		{
			body: ConsultaInputSchema,
			response: ConsultaResponseSchema,
			detail: {
				tags: ["Consulta"],
				description: "Query fiscal data using natural language",
			},
		},
	);
}

// ─── Default Module ─────────────────────────────────────────────────────

export const consultaModule = buildConsultaModule();
