import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage } from "../shared/api-response";
import { exportGeneralLedgerPdf } from "./application/queries/export-general-ledger-pdf.query";
import { exportGeneralLedgerXlsx } from "./application/queries/export-general-ledger-xlsx.query";

export const ledgerExportRoutes = new Elysia({ prefix: "/api/ledger/export" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post(
		"/pdf",
		async ({ body, companyContext, set }) => {
			try {
				if (!companyContext) {
					set.status = 401;
					return fail(
						"Company context is required",
						"COMPANY_CONTEXT_REQUIRED",
					);
				}
				const result = await exportGeneralLedgerPdf({
					companyId: companyContext.companyId,
					startDate: body.startDate,
					endDate: body.endDate,
				});
				if (!result.ok) {
					set.status = result.status;
					return fail(result.message, result.code);
				}
				set.headers["Content-Type"] = result.contentType;
				set.headers["Content-Disposition"] = result.disposition;
				return result.buffer;
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: t.Object({
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/xlsx",
		async ({ body, companyContext, set }) => {
			try {
				if (!companyContext) {
					set.status = 401;
					return fail(
						"Company context is required",
						"COMPANY_CONTEXT_REQUIRED",
					);
				}
				const result = await exportGeneralLedgerXlsx({
					companyId: companyContext.companyId,
					startDate: body.startDate,
					endDate: body.endDate,
				});
				if (!result.ok) {
					set.status = result.status;
					return fail(result.message, result.code);
				}
				set.headers["Content-Type"] = result.contentType;
				set.headers["Content-Disposition"] = result.disposition;
				return result.buffer;
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: t.Object({
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
			}),
		},
	);
