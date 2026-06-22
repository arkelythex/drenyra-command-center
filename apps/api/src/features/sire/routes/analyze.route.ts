import { Elysia } from "elysia";
import { analyzeMassive } from "../application/commands/analyze-massive.command";
import { AnalyzeSireBodySchema, AnalyzeSireQuerySchema } from "../sire.schemas";

export const analyzeSireRoute = new Elysia().post(
	"/analyze",
	async ({ body, query, set }) => analyzeMassive(body, query, set),
	{
		body: AnalyzeSireBodySchema,
		query: AnalyzeSireQuerySchema,
		detail: {
			tags: ["SIRE"],
			summary: "Análisis Masivo SIRE (Powered by Rust)",
			description: "Sube un archivo SIRE y procesalo con Polars.",
		},
	},
);
