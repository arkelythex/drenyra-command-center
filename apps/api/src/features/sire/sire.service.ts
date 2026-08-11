import type {
	SIREExportOptions,
	SIRESummary,
	SIRESunatLiveLedgerSummary,
	SIRESunatLiveSummary,
	SIRESunatLiveUnavailableReason,
} from "@drenyra/domain";
import { createLogger } from "../../lib/logger";
import { DataEngineClient } from "../../shared/clients/data-engine.client";
import { buildSireConfig } from "./services/sire-config.service";
import {
	buildSunatLiveRetryPolicyFromEnv,
	parseRetryAfterMs,
	resolveSunatRetryDelayMs,
} from "./services/sire-live-retry-policy.service";
import { resolveAuthToken } from "./services/sire-oauth.service";
import { SireRegisterExportService } from "./services/sire-register-export.service";
import { resolveTenantSunatContext } from "./services/tenant-sunat-context.service";
import type { TenantSunatContext } from "./types";

const logger = createLogger({ module: "sire/service" });

export interface SireMassiveAnalysisResult {
	companyId: string;
	status: "success";
	engine: string;
	[key: string]: unknown;
}

type SunatLiveLedgerFetchResult =
	| {
			ok: true;
			data: SIRESunatLiveLedgerSummary;
	  }
	| {
			ok: false;
			reason: Extract<
				SIRESunatLiveUnavailableReason,
				| "auth_unavailable"
				| "timeout"
				| "upstream_error"
				| "invalid_payload"
				| "internal_error"
			>;
			error: string;
			retryable: boolean;
			retryAfterMs: number | null;
			attempts: number;
	  };

/**
 * SIRE Application Service.
 *
 * Handles SUNAT Electronic Register processing by delegating heavy computation
 * to the Data Engine microservice (Python + Polars with Rust acceleration).
 *
 * **Architecture:**
 * - This service is a thin adapter (Hexagonal Architecture)
 * - Heavy processing delegated to Data Engine (port 8000)
 * - Future: Add job tracking in `processing_jobs` table
 *
 * **SUNAT Context:**
 * - SIRE = Sistema Integrado de Registros Electrónicos
 * - Required for all taxpayers starting 2026
 * - Must submit by day 10 of following month
 * - Formats: Compras (purchases), Ventas (sales)
 *
 * @example
 * ```ts
 * import { SireService } from './sire.service';
 *
 * const file = new File(['...'], 'ventas_202601.txt');
 * const result = await SireService.analyzeMassive('cmp_123', file);
 * console.log(result.status); // 'success'
 * ```
 */
export class SireService {
	/**
	 * Process a massive SIRE file using the Data Engine.
	 *
	 * This method delegates heavy CSV/XML parsing and validation to the Data
	 * Engine microservice, which uses Polars (Rust-accelerated dataframes) for
	 * high-performance processing.
	 *
	 * **Business Rules:**
	 * - File must be in SUNAT format (pipe-delimited or UBL XML)
	 * - Period format: YYYYMM00 (e.g., "20260100")
	 * - All monetary amounts must use 2 decimal places
	 * - RUC validation via Módulo 11
	 *
	 * **Edge Cases:**
	 * - Invalid file format → Data Engine returns 400 error
	 * - Data Engine offline → throws connection error
	 * - Duplicate records → Data Engine deduplicates by correlativo
	 * - Missing required fields → validation errors in response
	 *
	 * @param companyId - Company UUID (must exist in database)
	 * @param file - SIRE file (CSV or XML, max 10MB)
	 * @returns Analysis result with validation errors/warnings
	 * @throws Error - Data Engine connection failed (see logs)
	 * @throws Error - Data Engine returned 4xx/5xx status
	 *
	 * @example
	 * ```ts
	 * // Valid SIRE file
	 * const file = new File([
	 *   '20260100|1|15/01/2026|01|F001|00000001|...'
	 * ], 'sire.txt');
	 *
	 * const result = await SireService.analyzeMassive(
	 *   '550e8400-e29b-41d4-a716-446655440000',
	 *   file
	 * );
	 *
	 * // Result structure
	 * {
	 *   companyId: 'cmp_123',
	 *   status: 'success',
	 *   engine: 'Polars (Rust Accelerated)',
	 *   recordCount: 150,
	 *   errors: [],
	 *   warnings: []
	 * }
	 * ```
	 *
	 * @see {@link DataEngineClient.analyzeSire} Data Engine client
	 * @see {@link /apps/api/src/services/sire.service.spec.ts} Test cases
	 */
	static async analyzeMassive(
		companyId: string,
		file: File,
	): Promise<SireMassiveAnalysisResult> {
		logger.info(
			{
				companyId,
				fileName: file.name,
				fileSizeBytes: file.size,
				fileType: file.type || "unknown",
			},
			"Delegating SIRE heavy processing to Data Engine",
		);

		// 1. (Opcional) Aquí podríamos guardar el registro del intento en DB "processing_jobs"

		// 2. Llamada al microservicio Python
		const result = await DataEngineClient.analyzeSire(file);

		// 3. (Opcional) Guardar resultados resumidos en Postgres

		return {
			companyId,
			status: "success",
			engine: "Polars (Rust Accelerated)",
			...result,
		};
	}

	/**
	 * Generate SIRE sales register from source transactions.
	 */
	static async generateSalesRegister(
		options: SIREExportOptions,
	): Promise<string | Buffer> {
		return SireRegisterExportService.generateSalesRegister(options);
	}

	/**
	 * Generate SIRE purchases register from source transactions.
	 */
	static async generatePurchasesRegister(
		options: SIREExportOptions,
	): Promise<string | Buffer> {
		return SireRegisterExportService.generatePurchasesRegister(options);
	}

	/**
	 * Retrieve SIRE summary for a period.
	 */
	static async getSummary(options: SIREExportOptions): Promise<SIRESummary> {
		return SireRegisterExportService.getSummary(options);
	}

	/**
	 * Retrieve a best-effort live summary from SUNAT SIRE API.
	 *
	 * Uses `SIRE_API_SUMMARY_PATH_TEMPLATE` when configured.
	 * Template placeholders supported: `{companyId}`, `{period}`, `{ruc}`, `{ledgerType}`.
	 */
	static async getSunatLiveSummary(input: {
		companyId: string;
		period: string;
		ruc?: string;
	}): Promise<SIRESunatLiveSummary> {
		const checkedAt = new Date().toISOString();
		const pathTemplate = (
			process.env.SIRE_API_SUMMARY_PATH_TEMPLATE ?? ""
		).trim();
		if (!pathTemplate) {
			return SireService.buildUnavailableLiveSummary(
				input.period,
				checkedAt,
				"missing_config",
				"SIRE_API_SUMMARY_PATH_TEMPLATE no configurado. Flujo continuará con conciliación local.",
			);
		}

		const config = buildSireConfig();
		if (config.mode !== "api") {
			return SireService.buildUnavailableLiveSummary(
				input.period,
				checkedAt,
				"api_mode_disabled",
				"SIRE_SUBMISSION_MODE no está en api. Flujo continuará con conciliación local.",
			);
		}

		let tenantSunatContext: TenantSunatContext;
		try {
			tenantSunatContext = await resolveTenantSunatContext({
				companyId: input.companyId,
				scope: "sire.live-summary",
				deprecatedEnvRuc: config.deprecatedCompanyRuc,
				suppliedRuc: input.ruc ?? null,
			});
		} catch (error: unknown) {
			logger.warn(
				{
					error,
					companyId: input.companyId,
					period: input.period,
				},
				"SUNAT live summary tenant context resolution failed",
			);
			return SireService.buildUnavailableLiveSummary(
				input.period,
				checkedAt,
				"auth_unavailable",
				"No se pudo resolver el RUC SUNAT autenticado para consulta en tiempo real. Flujo continuará con conciliación local.",
			);
		}

		let authToken = "";
		try {
			authToken = await resolveAuthToken(config, tenantSunatContext);
		} catch (error: unknown) {
			logger.warn(
				{
					error,
					companyId: input.companyId,
					period: input.period,
				},
				"SUNAT live summary token resolution failed",
			);
		}

		if (!authToken) {
			return SireService.buildUnavailableLiveSummary(
				input.period,
				checkedAt,
				"auth_unavailable",
				"No hay token SUNAT disponible para consulta en tiempo real. Flujo continuará con conciliación local.",
			);
		}

		const [salesResult, purchasesResult] = await Promise.all([
			SireService.fetchSunatLiveLedgerSummary(
				"ventas",
				pathTemplate,
				{ ...input, ruc: tenantSunatContext.ruc },
				config.baseUrl,
				config.timeoutMs,
				authToken,
			),
			SireService.fetchSunatLiveLedgerSummary(
				"compras",
				pathTemplate,
				{ ...input, ruc: tenantSunatContext.ruc },
				config.baseUrl,
				config.timeoutMs,
				authToken,
			),
		]);

		const failures = [salesResult, purchasesResult].filter(
			(result): result is Exclude<SunatLiveLedgerFetchResult, { ok: true }> =>
				!result.ok,
		);

		if (failures.length > 0) {
			logger.warn(
				{
					companyId: input.companyId,
					period: input.period,
					failures: failures.map((failure) => ({
						reason: failure.reason,
						error: failure.error,
						attempts: failure.attempts,
					})),
				},
				"SUNAT live summary unavailable",
			);

			const reason = SireService.resolveUnavailableReason(
				failures.map((failure) => failure.reason),
			);
			const message = `No se pudo consultar SUNAT en tiempo real: ${failures
				.map((failure) => failure.error)
				.join(" | ")}`;

			return SireService.buildUnavailableLiveSummary(
				input.period,
				checkedAt,
				reason,
				message,
			);
		}

		const ledgers = [salesResult, purchasesResult]
			.filter(
				(
					result,
				): result is {
					ok: true;
					data: SIRESunatLiveLedgerSummary;
				} => result.ok,
			)
			.map((result) => result.data);

		return {
			source: "sunat-api",
			status: "available",
			period: input.period,
			checkedAt,
			message: "Resumen SUNAT API consultado en tiempo real.",
			ledgers,
		};
	}

	private static async fetchSunatLiveLedgerSummary(
		ledgerType: "ventas" | "compras",
		pathTemplate: string,
		input: { companyId: string; period: string; ruc: string },
		baseUrl: string,
		timeoutMs: number,
		authToken: string,
	): Promise<SunatLiveLedgerFetchResult> {
		const endpoint = new URL(
			SireService.resolvePathTemplate(pathTemplate, {
				companyId: input.companyId,
				period: input.period,
				ruc: input.ruc,
				ledgerType,
			}),
			baseUrl,
		).toString();
		const retryPolicy = buildSunatLiveRetryPolicyFromEnv();

		for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
			const attemptResult =
				await SireService.fetchSunatLiveLedgerSummaryAttempt(
					ledgerType,
					endpoint,
					timeoutMs,
					authToken,
					attempt,
				);

			if (attemptResult.ok) {
				return attemptResult;
			}

			const hasRemainingAttempts = attempt < retryPolicy.maxAttempts;
			if (!attemptResult.retryable || !hasRemainingAttempts) {
				return attemptResult;
			}

			const delayMs = resolveSunatRetryDelayMs({
				retryPolicy,
				attempt,
				retryAfterMs: attemptResult.retryAfterMs,
			});

			logger.warn(
				{
					ledgerType,
					period: input.period,
					reason: attemptResult.reason,
					error: attemptResult.error,
					attempt,
					maxAttempts: retryPolicy.maxAttempts,
					delayMs,
				},
				"Retrying SUNAT live summary ledger query",
			);

			await SireService.sleep(delayMs);
		}

		return {
			ok: false,
			reason: "internal_error",
			error: `${ledgerType}: error de consulta SUNAT`,
			retryable: false,
			retryAfterMs: null,
			attempts: retryPolicy.maxAttempts,
		};
	}

	private static async fetchSunatLiveLedgerSummaryAttempt(
		ledgerType: "ventas" | "compras",
		endpoint: string,
		timeoutMs: number,
		authToken: string,
		attempt: number,
	): Promise<
		| { ok: true; data: SIRESunatLiveLedgerSummary }
		| {
				ok: false;
				reason: Extract<
					SIRESunatLiveUnavailableReason,
					| "auth_unavailable"
					| "timeout"
					| "upstream_error"
					| "invalid_payload"
					| "internal_error"
				>;
				error: string;
				retryable: boolean;
				retryAfterMs: number | null;
				attempts: number;
		  }
	> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(endpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${authToken}`,
					Accept: "application/json",
				},
				signal: controller.signal,
			});

			const payload = await SireService.readPayload(response);
			if (!response.ok) {
				const isAuthError = response.status === 401 || response.status === 403;
				const isRetryableStatus =
					response.status === 408 ||
					response.status === 429 ||
					response.status >= 500;

				return {
					ok: false,
					reason: isAuthError ? "auth_unavailable" : "upstream_error",
					error: `${ledgerType}: HTTP ${response.status}`,
					retryable: !isAuthError && isRetryableStatus,
					retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
					attempts: attempt,
				};
			}

			const payloadObject = SireService.asObject(payload);
			const dataObject = SireService.asObject(payloadObject?.data);
			const source = dataObject ?? payloadObject;

			const recordCount = SireService.readNumber(source, [
				"recordCount",
				"records",
				"totalRecords",
				"cantidadRegistros",
			]);
			const totalAmount = SireService.readNumber(source, [
				"totalAmount",
				"montoTotal",
				"importeTotal",
			]);
			const totalIGV = SireService.readNumber(source, [
				"totalIGV",
				"igvTotal",
				"montoIGV",
				"igv",
			]);

			if (
				recordCount === undefined ||
				totalAmount === undefined ||
				totalIGV === undefined
			) {
				return {
					ok: false,
					reason: "invalid_payload",
					error: `${ledgerType}: payload SUNAT sin campos de resumen esperados`,
					retryable: false,
					retryAfterMs: null,
					attempts: attempt,
				};
			}

			return {
				ok: true,
				data: {
					ledgerType,
					recordCount: Math.max(0, Math.round(recordCount)),
					totalAmount: Math.max(0, totalAmount),
					totalIGV: Math.max(0, totalIGV),
				},
			};
		} catch (error: unknown) {
			if (error instanceof Error && error.name === "AbortError") {
				return {
					ok: false,
					reason: "timeout",
					error: `${ledgerType}: timeout SUNAT tras ${timeoutMs}ms`,
					retryable: true,
					retryAfterMs: null,
					attempts: attempt,
				};
			}
			if (error instanceof SyntaxError) {
				return {
					ok: false,
					reason: "invalid_payload",
					error: `${ledgerType}: payload SUNAT inválido`,
					retryable: false,
					retryAfterMs: null,
					attempts: attempt,
				};
			}
			if (error instanceof TypeError) {
				return {
					ok: false,
					reason: "upstream_error",
					error: `${ledgerType}: error de red SUNAT`,
					retryable: true,
					retryAfterMs: null,
					attempts: attempt,
				};
			}
			return {
				ok: false,
				reason: "internal_error",
				error: `${ledgerType}: error de consulta SUNAT`,
				retryable: false,
				retryAfterMs: null,
				attempts: attempt,
			};
		} finally {
			clearTimeout(timeout);
		}
	}

	private static async sleep(ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}

	private static buildUnavailableLiveSummary(
		period: string,
		checkedAt: string,
		reason: SIRESunatLiveUnavailableReason,
		message: string,
	): SIRESunatLiveSummary {
		return {
			source: "sunat-api",
			status: "unavailable",
			period,
			checkedAt,
			reason,
			message,
			ledgers: [],
		};
	}

	private static resolveUnavailableReason(
		reasons: Array<
			Extract<
				SIRESunatLiveUnavailableReason,
				| "auth_unavailable"
				| "timeout"
				| "upstream_error"
				| "invalid_payload"
				| "internal_error"
			>
		>,
	): Extract<
		SIRESunatLiveUnavailableReason,
		| "auth_unavailable"
		| "timeout"
		| "upstream_error"
		| "invalid_payload"
		| "internal_error"
	> {
		if (reasons.includes("auth_unavailable")) {
			return "auth_unavailable";
		}
		if (reasons.includes("timeout")) {
			return "timeout";
		}
		if (reasons.includes("invalid_payload")) {
			return "invalid_payload";
		}
		if (reasons.includes("upstream_error")) {
			return "upstream_error";
		}
		return "internal_error";
	}

	private static resolvePathTemplate(
		template: string,
		values: {
			companyId: string;
			period: string;
			ruc: string;
			ledgerType: "ventas" | "compras";
		},
	): string {
		return template
			.split("{companyId}")
			.join(encodeURIComponent(values.companyId))
			.split("{period}")
			.join(encodeURIComponent(values.period))
			.split("{ruc}")
			.join(encodeURIComponent(values.ruc))
			.split("{ledgerType}")
			.join(encodeURIComponent(values.ledgerType));
	}

	private static async readPayload(response: Response): Promise<unknown> {
		const contentType =
			response.headers.get("content-type")?.toLowerCase() ?? "";
		if (contentType.includes("application/json")) {
			return response.json();
		}

		const text = await response.text();
		return text.trim() ? text : null;
	}

	private static asObject(value: unknown): Record<string, unknown> | null {
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			return null;
		}

		return value as Record<string, unknown>;
	}

	private static readNumber(
		payload: Record<string, unknown> | null,
		keys: string[],
	): number | undefined {
		if (!payload) {
			return undefined;
		}

		for (const key of keys) {
			const value = payload[key];
			if (typeof value === "number" && Number.isFinite(value)) {
				return value;
			}
			if (typeof value === "string") {
				const parsed = Number.parseFloat(value);
				if (Number.isFinite(parsed)) {
					return parsed;
				}
			}
		}

		return undefined;
	}
}
