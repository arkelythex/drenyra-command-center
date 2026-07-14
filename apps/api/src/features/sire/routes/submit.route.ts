import { Elysia } from "elysia";
import { tenantAuth } from "../../../shared/plugins/tenant-auth";
import { submitSire } from "../application/commands/submit-sire.command";
import { SubmitSireSchema } from "../sire.schemas";

/**
 * SIRE Submit Route
 *
 * Wave 3A: Uses tenantAuth middleware to derive companyId from verified
 * membership. body.companyId is treated only as a client-side selection
 * hint and MUST match the authenticated tenant context.
 */
export const submitSireRoute = new Elysia()
	.use(tenantAuth({ allowHeaderFallback: false }))
	.post(
		"/submit",
		// biome-ignore lint/suspicious/noExplicitAny: Elysia context with custom store
		async ({ body, set, tenantContext }: any) =>
			submitSire(body, set, tenantContext?.companyId),
		{
			body: SubmitSireSchema,
			detail: {
				tags: ["SIRE"],
				summary: "Enviar libro SIRE a SUNAT",
				description:
					"Envio API-first a SUNAT con fallback de simulacion cuando no hay credenciales. " +
					"Wave 3A: companyId se deriva del contexto autenticado, no del body.",
			},
		},
	);
