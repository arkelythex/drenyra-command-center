import { Elysia } from "elysia";
import { submitSire } from "../application/commands/submit-sire.command";
import { SubmitSireSchema } from "../sire.schemas";

export const submitSireRoute = new Elysia().post(
	"/submit",
	async ({ body, set }) => submitSire(body, set),
	{
		body: SubmitSireSchema,
		detail: {
			tags: ["SIRE"],
			summary: "Enviar libro SIRE a SUNAT",
			description:
				"Envio API-first a SUNAT con fallback de simulacion cuando no hay credenciales. Rate limited: 10 req/min por company.",
		},
	},
);
