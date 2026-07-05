/**
 * CPE Validator API Routes
 * Real-time validation with configurable breach target (default < 5s)
 */

import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins/company-scope-guard";
import {
	getValidationCacheStats,
	validateCpe,
} from "../application/commands/validate-cpe.command";
import { CPE_RULES_PROFILE } from "../application/cpe-rules-profile";
import { SunatVisualFallbackSubagent } from "../application/fallback/sunat-visual-subagent";
import { SUNAT_CODE_CATALOG } from "../domain/sunat-code-catalog";
import { CpeNumber } from "../domain/value-objects/cpe-number.vo";
import { Ruc } from "../domain/value-objects/ruc.vo";

const fallbackSubagent = new SunatVisualFallbackSubagent();

/**
 * cpeValidatorRoutes const.
 *
 * @example
 * ```ts
 * console.log(cpeValidatorRoutes);
 * ```
 */
export const cpeValidatorRoutes = new Elysia({ prefix: "/api/cpe-validator" })
	.use(companyScopeGuard())
	// POST /cpe-validator/validate - Validate CPE XML
	.post(
		"/validate",
		async ({ body, set }) => {
			const result = await validateCpe(body);

			// Return 400 if validation failed or breach detected
			if (!result.isValid || result.breachDetected) {
				set.status = 400;
				return {
					success: false,
					data: result,
					code: result.incident.category,
					error: result.breachDetected
						? "Breach detected"
						: "Validation failed",
					supportMessage: result.incident.supportMessage,
					runbook: result.incident.runbook,
				};
			}

			return { success: true, data: result };
		},
		{
			body: t.Object({
				companyRuc: t.String({ minLength: 11, maxLength: 11 }),
				cpeNumber: t.String({
					minLength: 13,
					maxLength: 13,
					pattern: "^[A-Z][A-Z0-9]{0,3}-\\d{8}$",
				}),
				xmlContent: t.String({ minLength: 100 }),
				issueDate: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
				totalAmount: t.Number({ minimum: 0 }),
				skipCache: t.Optional(t.Boolean()),
			}),
		},
	)

	// POST /cpe-validator/fallback/probe - Simulate visual fallback + optional HITL
	.post(
		"/fallback/probe",
		async ({ body }) => {
			const cpeNumber = body.mode === "hitl" ? "F001-00007777" : body.cpeNumber;
			const result = await fallbackSubagent.run({
				ruc: Ruc.create(body.companyRuc),
				cpeNumber: CpeNumber.create(cpeNumber),
				issueDate: body.issueDate,
				totalAmount: body.totalAmount,
			});

			return {
				success: true,
				data: {
					source: "visual_subagent",
					fallbackActivated: true,
					response: result.response,
					trace: result.trace,
					hitl: result.hitl,
				},
			};
		},
		{
			body: t.Object({
				mode: t.Optional(t.Union([t.Literal("normal"), t.Literal("hitl")])),
				companyRuc: t.String({ minLength: 11, maxLength: 11 }),
				cpeNumber: t.String({
					minLength: 13,
					maxLength: 13,
				}),
				issueDate: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
				totalAmount: t.Number({ minimum: 0 }),
			}),
		},
	)

	// GET /cpe-validator/cache-stats - Get cache statistics
	.get("/cache-stats", async () => {
		return {
			success: true,
			data: getValidationCacheStats(),
		};
	})

	// GET /cpe-validator/rules-meta - Expose explicit SUNAT rules baseline/coverage
	.get("/rules-meta", () => ({
		success: true,
		data: CPE_RULES_PROFILE,
	}))

	// GET /cpe-validator/error-catalog - Stable support/UX mapping for common SUNAT issues
	.get("/error-catalog", () => ({
		success: true,
		data: {
			items: SUNAT_CODE_CATALOG,
			total: SUNAT_CODE_CATALOG.length,
		},
	}));
