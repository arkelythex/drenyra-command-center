import { Elysia } from "elysia";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { getConciliation } from "../application/queries/get-conciliation.query";
import { getSireDashboard } from "../application/queries/get-sire-dashboard.query";
import { SireRetryService } from "../services/sire-retry.service";
import {
	FiscalPeriodValidationError,
	resolveFiscalPeriodId,
} from "../services/fiscal-period.service";
import {
	SireConciliationQuerySchema,
	SireDashboardQuerySchema,
} from "../sire.schemas";

export const sireReportingRoutes = new Elysia()
	.get("/conciliation", async ({ query, set }) => {
			try {
				// Phase A (REQ-A-002): validate fiscal period when provided
				if (query.period) {
					await resolveFiscalPeriodId(query.companyId, query.period);
				}
			} catch (error) {
				if (error instanceof FiscalPeriodValidationError) {
					set.status = 422;
					return fail(error.message, error.code);
				}
				throw error;
			}
			return getConciliation(query, set);
		}, {
		query: SireConciliationQuerySchema,
		detail: {
			tags: ["SIRE"],
			summary: "Conciliación SIRE vs ledger",
			description:
				"Verifica reproducibilidad SIRE comparando libros electrónicos e ingresos del ledger.",
		},
	})
	.get("/dashboard", async ({ query, set }) => {
			try {
				// Phase A (REQ-A-002): validate fiscal period when provided
				if (query.period) {
					await resolveFiscalPeriodId(query.companyId, query.period);
				}
			} catch (error) {
				if (error instanceof FiscalPeriodValidationError) {
					set.status = 422;
					return fail(error.message, error.code);
				}
				throw error;
			}
			return getSireDashboard(query, set);
		}, {
		query: SireDashboardQuerySchema,
		detail: {
			tags: ["SIRE"],
			summary: "Dashboard operativo SIRE",
			description:
				"Resume estado de envío, deadline, issues de compliance y conciliación para el periodo.",
		},
	})
	.get(
		"/retry-queue",
		async ({ set }) => {
			try {
				const queueStatus = await SireRetryService.getQueueStatus();
				return ok(queueStatus);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "SIRE_RETRY_QUEUE_ERROR");
			}
		},
		{
			detail: {
				tags: ["SIRE"],
				summary: "Cola de reintentos SIRE",
				description:
					"Muestra submissions fallidos pendientes de retry automático con backoff exponencial.",
			},
		},
	);
