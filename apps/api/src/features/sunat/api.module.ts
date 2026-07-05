import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { generateInvoiceQr } from "./application/commands/generate-invoice-qr.command";
import { generateInvoiceXml } from "./application/commands/generate-invoice-xml.command";
import { validateInvoiceNumbering } from "./application/commands/validate-invoice-numbering.command";
import { validateRucOnline } from "./application/commands/validate-ruc-online.command";
import { getExchangeRate } from "./application/queries/get-exchange-rate.query";
import { getUit } from "./application/queries/get-uit.query";
import { validateRuc } from "./application/queries/validate-ruc.query";

/**
 * Elysia module exposing SUNAT-related validation, exchange-rate, XML, and QR endpoints.
 *
 * @example
 * ```ts
 * app.use(sunatApiModule);
 * ```
 */
export const sunatApiModule = new Elysia({ prefix: "/api/sunat" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post("/validate-ruc", ({ body }) => validateRuc(body.ruc), {
		body: t.Object({
			ruc: t.String(),
		}),
		detail: { tags: ["SUNAT"], summary: "Validate RUC locally" },
	})
	.post(
		"/validate-ruc-online",
		async ({ body }) => validateRucOnline(body.ruc),
		{
			body: t.Object({
				ruc: t.String(),
			}),
			detail: { tags: ["SUNAT"], summary: "Validate RUC online" },
		},
	)
	.get("/exchange-rate", async () => getExchangeRate(), {
		detail: { tags: ["SUNAT"], summary: "Get exchange rate" },
	})
	.get("/uit", () => getUit(), {
		detail: { tags: ["SUNAT"], summary: "Get UIT value" },
	})
	.post(
		"/generate-xml/:invoiceId",
		async ({ params: { invoiceId }, companyContext, set }) => {
			const result = await generateInvoiceXml(
				invoiceId,
				companyContext?.companyId,
			);
			if ("status" in result) {
				set.status = result.status;
				return result.body;
			}
			return result.body;
		},
		{
			params: t.Object({
				invoiceId: t.String(),
			}),
		},
	)
	.post(
		"/generate-qr/:invoiceId",
		async ({ params: { invoiceId }, companyContext, set }) => {
			const result = await generateInvoiceQr(
				invoiceId,
				companyContext?.companyId,
			);
			if ("status" in result) {
				set.status = result.status;
				return result.body;
			}
			return result.body;
		},
		{
			params: t.Object({
				invoiceId: t.String(),
			}),
		},
	)
	.post(
		"/validate-numbering",
		({ body }) => validateInvoiceNumbering(body.series, body.correlative),
		{
			body: t.Object({
				series: t.String(),
				correlative: t.Number(),
			}),
			detail: { tags: ["SUNAT"], summary: "Validate invoice numbering" },
		},
	);
