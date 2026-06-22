/**
 * Invoice Validation API Route
 *
 * POST /validate-invoices endpoint
 *
 * @module ai-swarm/api/invoice-validation
 */

import { Elysia } from "elysia";
import { fail } from "../../shared/api-response";
import { InvoiceValidationWorkflow } from "../workflows/invoice-validation.workflow";
import { enqueueSwarmAuditLog } from "./audit-log-bridge";
import { resolveOrganizationContextForRequest } from "./organization-context";
import { ValidateInvoicesRequestSchema } from "./schemas/invoice.schema";

/**
 * AI Swarm routes
 * @example
 * ```ts
 * console.log(aiSwarmRoutes);
 * ```
 */

export const invoiceValidationRoute = new Elysia({ prefix: "/api/ai-swarm" })
	/**
	 * POST /api/ai-swarm/validate-invoices
	 *
	 * Validate one or more invoices against SUNAT regulations
	 */
	.post(
		"/validate-invoices",
		async ({ body, request, set }) => {
			const organizationContext = resolveOrganizationContextForRequest({
				headers: request.headers,
			});
			if (!organizationContext.ok) {
				set.status = 400;
				return fail(organizationContext.error, organizationContext.code, {
					details: organizationContext.details,
				});
			}

			const organizationId = organizationContext.organizationId;
			const workflow = new InvoiceValidationWorkflow();
			const result = await workflow.execute(body);

			enqueueSwarmAuditLog({
				organizationId,
				agentName: "sunat-validator-agent",
				decisionType: "VALIDATE_INVOICES_COMPLETED",
				reasoning: "Validacion de comprobantes ejecutada con reglas SUNAT.",
				inputs: {
					invoiceCount: body.invoices.length,
					priority: body.priority ?? "medium",
				},
				outputs: {
					totalProcessed: result.totalProcessed,
					totalValid: result.totalValid,
					totalInvalid: result.totalInvalid,
					totalCostUsd: result.execution.totalCostUsd,
				},
			});

			return {
				success: true,
				data: result,
			};
		},
		{
			body: ValidateInvoicesRequestSchema,
			detail: {
				summary: "Validate invoices with SUNAT agent",
				description: `
Validates one or more invoices against SUNAT 2026 regulations.

Uses hybrid validation:
- Rule-based: RUC Módulo 11, IGV 18%, format checks
- AI-based: Contextual warnings (detracción, bancarización)

The orchestrator automatically decides whether to process
sequentially or in parallel batches based on volume.
        `,
				tags: ["AI Swarm"],
			},
		},
	);
