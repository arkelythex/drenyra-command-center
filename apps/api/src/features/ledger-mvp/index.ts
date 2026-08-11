import { Elysia } from "elysia";
import type { z } from "zod";
import { createLogger } from "../../lib/logger";
import { standardRateLimit } from "../../middleware/rate-limit.middleware";
import { resolveSessionContext } from "../security/session-context";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { ledgerExportRoutes } from "./export.routes";
import {
	recordLedgerMvpDeniedMetric,
	recordLedgerMvpRequestMetric,
	recordLedgerMvpSunatUnavailableMetric,
} from "./ledger-mvp.metrics";
import {
	LedgerMonitorFiscalInputSchema,
	LedgerNpifBasicQuerySchema,
	LedgerSireAutopilotInputSchema,
} from "./ledger-mvp.schemas";
import { LedgerMvpService } from "./ledger-mvp.service";
import type { LedgerNpifBasicResult } from "./ledger-mvp.types";
import {
	isCompanyAllowedForLedgerMvp,
	isLedgerMvpRoleAllowed,
	type LedgerMvpEndpoint,
	shouldRequireLedgerMvpAuth,
} from "./ledger-mvp-rollout.service";

export const ledgerMvpService = new LedgerMvpService();
const logger = createLogger({ module: "features/ledger-mvp/routes" });
const NPIF_MANUAL_VALIDATION_WARNING =
	"Resultado NPIF asistido, no autónomo: requiere validación contable manual del contador antes de presentación oficial.";

interface ScopeError {
	status: 401 | 403;
	code: string;
	error: string;
}

function resolveLedgerMachineCallerAllowlist(): readonly string[] {
	return (process.env.LEDGER_MVP_MACHINE_CALLER_ALLOWLIST ?? "")
		.split(",")
		.map((serviceId) => serviceId.trim())
		.filter((serviceId) => serviceId.length > 0);
}

async function resolveScopeError(
	endpoint: LedgerMvpEndpoint,
	headers: Record<string, unknown>,
	companyId: string,
): Promise<ScopeError | null> {
	if (!isCompanyAllowedForLedgerMvp(companyId)) {
		return {
			status: 403,
			code: "LEDGER_MVP_TENANT_NOT_ALLOWED",
			error: "Ledger MVP is not enabled for this company",
		};
	}

	const requireAuth = shouldRequireLedgerMvpAuth();

	const context = await resolveSessionContext({
		headers,
		requestedCompanyId: companyId,
		requireSession: requireAuth,
		allowMachineCaller: true,
		machineCallerAllowlist: resolveLedgerMachineCallerAllowlist(),
		securityProfile: "sensitive-write",
	});

	if (context.ok) {
		if (!isLedgerMvpRoleAllowed(endpoint, context.context.role)) {
			return {
				status: 403,
				code: "LEDGER_MVP_ROLE_FORBIDDEN",
				error: `Role "${context.context.role}" is not allowed to access Ledger MVP`,
			};
		}

		return null;
	}

	return {
		status: context.status,
		code: context.code,
		error: context.error,
	};
}

function buildValidationDetails(error: z.ZodError<unknown>): Array<{
	path: Array<string | number>;
	message: string;
}> {
	return error.issues.map((issue) => ({
		path: issue.path.map((segment) =>
			typeof segment === "number" ? segment : String(segment),
		),
		message: issue.message,
	}));
}

function resolveDeniedReason(
	code: string,
): "auth" | "allowlist" | "role" | "unknown" {
	if (code === "LEDGER_MVP_TENANT_NOT_ALLOWED") {
		return "allowlist";
	}

	if (code === "LEDGER_MVP_ROLE_FORBIDDEN") {
		return "role";
	}

	if (
		code.includes("AUTH") ||
		code.includes("SESSION") ||
		code.includes("UNAUTHORIZED") ||
		code.includes("SPOOFABLE")
	) {
		return "auth";
	}

	return "unknown";
}

function enforceNpifManualValidationWarning(
	result: LedgerNpifBasicResult,
): LedgerNpifBasicResult {
	const hasMandatoryWarning = result.warnings.some(
		(warning) => warning.trim() === NPIF_MANUAL_VALIDATION_WARNING,
	);

	if (hasMandatoryWarning) {
		return result;
	}

	return {
		...result,
		warnings: [NPIF_MANUAL_VALIDATION_WARNING, ...result.warnings],
	};
}

export const ledgerMvpModule = new Elysia({ prefix: "/api/ledger-mvp" })
	.use(standardRateLimit)
	.post(
		"/sire-autopilot/run",
		async ({ body, headers, set }) => {
			const startedAt = Date.now();
			const parsed = LedgerSireAutopilotInputSchema.safeParse(body);
			if (!parsed.success) {
				set.status = 422;
				recordLedgerMvpRequestMetric({
					endpoint: "sire_autopilot_run",
					outcome: "validation_error",
					httpStatus: 422,
					durationMs: Date.now() - startedAt,
				});
				return fail("Invalid SIRE Autopilot payload", "VALIDATION_ERROR", {
					details: buildValidationDetails(parsed.error),
				});
			}

			const scopeError = await resolveScopeError(
				"sire_autopilot_run",
				headers as Record<string, unknown>,
				parsed.data.companyId,
			);
			if (scopeError) {
				set.status = scopeError.status;
				recordLedgerMvpDeniedMetric({
					endpoint: "sire_autopilot_run",
					reason: resolveDeniedReason(scopeError.code),
					httpStatus: scopeError.status,
				});
				recordLedgerMvpRequestMetric({
					endpoint: "sire_autopilot_run",
					outcome: "scope_error",
					httpStatus: scopeError.status,
					durationMs: Date.now() - startedAt,
				});
				return fail(scopeError.error, scopeError.code);
			}

			try {
				const result = await ledgerMvpService.runSireAutopilot({
					...parsed.data,
					...(parsed.data.totalTolerance !== undefined
						? { totalTolerance: parsed.data.totalTolerance }
						: {}),
					...(parsed.data.igvTolerance !== undefined
						? { igvTolerance: parsed.data.igvTolerance }
						: {}),
					...(parsed.data.recordTolerance !== undefined
						? { recordTolerance: parsed.data.recordTolerance }
						: {}),
				});
				if (result.evidence.sunatLiveSummary.status === "unavailable") {
					recordLedgerMvpSunatUnavailableMetric({
						endpoint: "sire_autopilot_run",
						reason: result.evidence.sunatLiveSummary.reason,
					});
					logger.warn(
						{
							endpoint: "sire_autopilot_run",
							companyId: parsed.data.companyId,
							period: parsed.data.period,
							reason: result.evidence.sunatLiveSummary.reason,
							sunatMessage: result.evidence.sunatLiveSummary.message,
							traceId: result.traceId,
						},
						"Ledger MVP SIRE autopilot continuing with SUNAT degraded mode",
					);
				}
				recordLedgerMvpRequestMetric({
					endpoint: "sire_autopilot_run",
					outcome: "success",
					httpStatus: 200,
					durationMs: Date.now() - startedAt,
				});
				logger.info(
					{
						endpoint: "sire_autopilot_run",
						companyId: parsed.data.companyId,
						period: parsed.data.period,
						flowStatus: result.status,
						traceId: result.traceId,
						durationMs: Date.now() - startedAt,
					},
					"Ledger MVP flow completed",
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				recordLedgerMvpRequestMetric({
					endpoint: "sire_autopilot_run",
					outcome: "internal_error",
					httpStatus: 500,
					durationMs: Date.now() - startedAt,
				});
				logger.error(
					{
						endpoint: "sire_autopilot_run",
						companyId: parsed.data.companyId,
						period: parsed.data.period,
						durationMs: Date.now() - startedAt,
						error,
					},
					"Ledger MVP flow failed",
				);
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: {
				tags: ["Ledger MVP"],
				summary: "Run SIRE Autopilot (conciliation + PDT 621 prefill)",
			},
		},
	)
	.get(
		"/npif-basic",
		async ({ query, headers, set }) => {
			const startedAt = Date.now();
			const parsed = LedgerNpifBasicQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				recordLedgerMvpRequestMetric({
					endpoint: "npif_basic_get",
					outcome: "validation_error",
					httpStatus: 422,
					durationMs: Date.now() - startedAt,
				});
				return fail("Invalid NPIF query payload", "VALIDATION_ERROR", {
					details: buildValidationDetails(parsed.error),
				});
			}

			const scopeError = await resolveScopeError(
				"npif_basic_get",
				headers as Record<string, unknown>,
				parsed.data.companyId,
			);
			if (scopeError) {
				set.status = scopeError.status;
				recordLedgerMvpDeniedMetric({
					endpoint: "npif_basic_get",
					reason: resolveDeniedReason(scopeError.code),
					httpStatus: scopeError.status,
				});
				recordLedgerMvpRequestMetric({
					endpoint: "npif_basic_get",
					outcome: "scope_error",
					httpStatus: scopeError.status,
					durationMs: Date.now() - startedAt,
				});
				return fail(scopeError.error, scopeError.code);
			}

			try {
				const result = enforceNpifManualValidationWarning(
					await ledgerMvpService.generateNpifBasic(parsed.data),
				);
				recordLedgerMvpRequestMetric({
					endpoint: "npif_basic_get",
					outcome: "success",
					httpStatus: 200,
					durationMs: Date.now() - startedAt,
				});
				logger.info(
					{
						endpoint: "npif_basic_get",
						companyId: parsed.data.companyId,
						period: parsed.data.period,
						flowStatus: result.status,
						traceId: result.traceId,
						durationMs: Date.now() - startedAt,
					},
					"Ledger MVP flow completed",
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				recordLedgerMvpRequestMetric({
					endpoint: "npif_basic_get",
					outcome: "internal_error",
					httpStatus: 500,
					durationMs: Date.now() - startedAt,
				});
				logger.error(
					{
						endpoint: "npif_basic_get",
						companyId: parsed.data.companyId,
						period: parsed.data.period,
						durationMs: Date.now() - startedAt,
						error,
					},
					"Ledger MVP flow failed",
				);
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: {
				tags: ["Ledger MVP"],
				summary: "Generate baseline NPIF microempresa statements",
			},
		},
	)
	.post(
		"/monitor-fiscal/run",
		async ({ body, headers, set }) => {
			const startedAt = Date.now();
			const parsed = LedgerMonitorFiscalInputSchema.safeParse(body);
			if (!parsed.success) {
				set.status = 422;
				recordLedgerMvpRequestMetric({
					endpoint: "monitor_fiscal_run",
					outcome: "validation_error",
					httpStatus: 422,
					durationMs: Date.now() - startedAt,
				});
				return fail("Invalid Monitor Fiscal payload", "VALIDATION_ERROR", {
					details: buildValidationDetails(parsed.error),
				});
			}

			const scopeError = await resolveScopeError(
				"monitor_fiscal_run",
				headers as Record<string, unknown>,
				parsed.data.companyId,
			);
			if (scopeError) {
				set.status = scopeError.status;
				recordLedgerMvpDeniedMetric({
					endpoint: "monitor_fiscal_run",
					reason: resolveDeniedReason(scopeError.code),
					httpStatus: scopeError.status,
				});
				recordLedgerMvpRequestMetric({
					endpoint: "monitor_fiscal_run",
					outcome: "scope_error",
					httpStatus: scopeError.status,
					durationMs: Date.now() - startedAt,
				});
				return fail(scopeError.error, scopeError.code);
			}

			try {
				const result = await ledgerMvpService.runMonitorFiscal({
					...parsed.data,
					...(parsed.data.sire !== undefined
						? {
								sire: {
									rvieRecords: parsed.data.sire.rvieRecords,
									rceRecords: parsed.data.sire.rceRecords,
									...(parsed.data.sire.accepted !== undefined
										? { accepted: parsed.data.sire.accepted }
										: {}),
								},
							}
						: {}),
				});
				recordLedgerMvpRequestMetric({
					endpoint: "monitor_fiscal_run",
					outcome: "success",
					httpStatus: 200,
					durationMs: Date.now() - startedAt,
				});
				logger.info(
					{
						endpoint: "monitor_fiscal_run",
						companyId: parsed.data.companyId,
						period: parsed.data.period,
						flowStatus: result.status,
						traceId: result.traceId,
						durationMs: Date.now() - startedAt,
					},
					"Ledger MVP flow completed",
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				recordLedgerMvpRequestMetric({
					endpoint: "monitor_fiscal_run",
					outcome: "internal_error",
					httpStatus: 500,
					durationMs: Date.now() - startedAt,
				});
				logger.error(
					{
						endpoint: "monitor_fiscal_run",
						companyId: parsed.data.companyId,
						period: parsed.data.period,
						durationMs: Date.now() - startedAt,
						error,
					},
					"Ledger MVP flow failed",
				);
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: {
				tags: ["Ledger MVP"],
				summary: "Run proactive fiscal monitor before SUNAT filing",
			},
		},
	)
	.use(ledgerExportRoutes);
