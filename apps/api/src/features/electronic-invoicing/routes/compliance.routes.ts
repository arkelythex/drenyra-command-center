import { Elysia } from "elysia";
import { getComplianceMetrics } from "../application/queries/get-compliance-metrics.query";
import { companyParamsSchema } from "../schemas";

/**
 * electronicInvoicingComplianceRoutes const.
 *
 * @example
 * ```ts
 * console.log(electronicInvoicingComplianceRoutes);
 * ```
 */
export const electronicInvoicingComplianceRoutes = new Elysia().get(
	"/compliance/:companyId",
	({ params, set }) => getComplianceMetrics(params.companyId, set),
	{
		params: companyParamsSchema,
		detail: {
			summary: "Obtener métricas de compliance SUNAT",
			description:
				"Devuelve estadísticas de aceptación/rechazo de facturas electrónicas enviadas a SUNAT",
			tags: ["Electronic Invoicing", "Compliance"],
		},
	},
);
