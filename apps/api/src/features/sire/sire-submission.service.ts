/**
 * SIRE Submission Service — Facade.
 * Orchestrates the SIRE submission flow using extracted modules.
 * Split from 640 lines → 180 lines facade + 3 modules.
 */

import { buildSireConfig } from "./services/sire-config.service";
import {
	clearOAuthTokenCache,
	resolveAuthToken,
} from "./services/sire-oauth.service";
import { evaluateSireSubmissionPolicy } from "./services/sire-policy-2026.service";
import { SireTimeoutError } from "./sire-errors";
import type {
	SireSubmissionConfig,
	SireSubmissionResult,
	SubmitSireInput,
	TenantSunatContext,
} from "./types";

// Re-export types for backward compatibility
export type {
	SireAuthMode,
	SireLedgerType,
	SirePayloadFormat,
	SireSubmissionConfig,
	SireSubmissionResult,
	SireUploadMode,
	SubmitSireInput,
} from "./types";

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const ZIP_SIGNATURE_FIRST_BYTE = 0x50;
const ZIP_SIGNATURE_SECOND_BYTE = 0x4b;

export interface SireSubmissionOptions {
	tenantSunatContext?: TenantSunatContext;
}

export class SireSubmissionService {
	static async submit(
		input: SubmitSireInput,
		options: SireSubmissionOptions = {},
	): Promise<SireSubmissionResult> {
		SireSubmissionService.validateInput(input);
		const config = buildSireConfig();
		const policy = evaluateSireSubmissionPolicy({
			period: input.period,
			companyAnnualIncomePen: input.companyAnnualIncomePen,
			isPrico: input.isPrico,
		});

		if (policy.isDeferred) {
			return SireSubmissionService.simulateSubmission(
				input,
				policy.reason,
				policy,
			);
		}

		if (config.mode === "simulation") {
			return SireSubmissionService.simulateSubmission(
				input,
				"SIRE_SUBMISSION_MODE=simulation",
				policy,
			);
		}

		const authToken = await resolveAuthToken(
			config,
			options.tenantSunatContext,
		);
		if (!authToken) {
			if (config.allowSimulationFallbackInApiMode) {
				return SireSubmissionService.simulateSubmission(
					input,
					"API mode without credentials (fallback simulation enabled)",
					policy,
				);
			}
			throw new Error(
				"SIRE API credentials missing. Configure SIRE_API_TOKEN or SUNAT OAuth SOL credentials.",
			);
		}

		if (!options.tenantSunatContext) {
			throw new Error(
				"Tenant SUNAT context is required for SIRE API submissions.",
			);
		}

		const result = await SireSubmissionService.submitToSunatApi(
			config,
			input,
			authToken,
			options.tenantSunatContext,
		);
		return { ...result, policy };
	}

	static clearOAuthTokenCacheForTests(): void {
		clearOAuthTokenCache();
	}

	private static validateInput(input: SubmitSireInput): void {
		if (!input.companyId.trim()) throw new Error("Invalid companyId: required");
		if (!PERIOD_REGEX.test(input.period))
			throw new Error("Invalid period format: expected YYYY-MM");
		if (!input.payloadBase64.trim())
			throw new Error("Invalid payloadBase64: required");
		if (
			input.companyAnnualIncomePen !== undefined &&
			(!Number.isFinite(input.companyAnnualIncomePen) ||
				input.companyAnnualIncomePen < 0)
		) {
			throw new Error(
				"Invalid companyAnnualIncomePen: expected non-negative number",
			);
		}
	}

	private static simulateSubmission(
		input: SubmitSireInput,
		reason: string,
		policy?: SireSubmissionResult["policy"],
	): SireSubmissionResult {
		return {
			submissionId: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
			status: "SIMULATED",
			provider: "simulation",
			submittedAt: new Date().toISOString(),
			period: input.period,
			ledgerType: input.ledgerType,
			dryRun: input.dryRun ?? false,
			message: `SIRE submission simulated (${reason})`,
			policy,
		};
	}

	private static async submitToSunatApi(
		config: SireSubmissionConfig,
		input: SubmitSireInput,
		authToken: string,
		tenantSunatContext?: TenantSunatContext,
	): Promise<SireSubmissionResult> {
		const endpoint = new URL(
			input.ledgerType === "ventas"
				? config.salesSubmissionPath
				: config.purchasesSubmissionPath,
			config.baseUrl,
		).toString();
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

		try {
			const request = SireSubmissionService.buildSubmissionRequest(
				config,
				input,
				authToken,
				tenantSunatContext,
			);
			const response = await fetch(endpoint, {
				method: "POST",
				headers: request.headers,
				body: request.body,
				signal: controller.signal,
			});

			const payload = await SireSubmissionService.readPayload(response);
			if (!response.ok) {
				throw new Error(
					SireSubmissionService.buildApiError(response.status, payload),
				);
			}

			return SireSubmissionService.mapApiResponse(input, payload);
		} catch (error: unknown) {
			if (error instanceof Error && error.name === "AbortError") {
				throw new SireTimeoutError(`SIRE API timeout after ${config.timeoutMs}ms`);
			}
			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}

	private static buildSubmissionRequest(
		config: SireSubmissionConfig,
		input: SubmitSireInput,
		authToken: string,
		tenantSunatContext?: TenantSunatContext,
	): { headers: Record<string, string>; body: BodyInit } {
		const baseHeaders: Record<string, string> = {
			Authorization: `Bearer ${authToken}`,
			...(input.idempotencyKey
				? { "X-Idempotency-Key": input.idempotencyKey }
				: {}),
		};

		const outboundRuc = tenantSunatContext?.ruc ?? config.companyRuc;

		if (config.uploadMode === "multipart-zip") {
			const zipBuffer = Buffer.from(input.payloadBase64, "base64");
			if (!SireSubmissionService.isZipBuffer(zipBuffer)) {
				throw new Error(
					"payloadBase64 must be a ZIP file encoded in base64 when SIRE_API_UPLOAD_MODE=multipart-zip",
				);
			}

			const formData = new FormData();
			const fileName = SireSubmissionService.buildZipFileName(
				input,
				outboundRuc,
			);
			formData.append(
				config.uploadFieldName,
				new Blob([zipBuffer], { type: "application/zip" }),
				fileName,
			);
			formData.append("period", input.period);
			formData.append("ledgerType", input.ledgerType);
			formData.append("dryRun", String(input.dryRun ?? false));
			if (outboundRuc) formData.append("ruc", outboundRuc);

			return { headers: baseHeaders, body: formData };
		}

		return {
			headers: { ...baseHeaders, "Content-Type": "application/json" },
			body: JSON.stringify({
				companyId: input.companyId,
				ruc: outboundRuc || undefined,
				period: input.period,
				ledgerType: input.ledgerType,
				payloadFormat: input.payloadFormat,
				payloadBase64: input.payloadBase64,
				dryRun: input.dryRun ?? false,
			}),
		};
	}

	private static isZipBuffer(buffer: Buffer): boolean {
		return (
			buffer.length >= 2 &&
			buffer[0] === ZIP_SIGNATURE_FIRST_BYTE &&
			buffer[1] === ZIP_SIGNATURE_SECOND_BYTE
		);
	}

	private static buildZipFileName(input: SubmitSireInput, ruc: string): string {
		const periodWithoutDash = input.period.replace("-", "");
		const ledgerSuffix = input.ledgerType === "ventas" ? "RVIE" : "RCE";
		const identity = ruc || input.companyId;
		return `${periodWithoutDash}-${identity}-${ledgerSuffix}.zip`;
	}

	private static async readPayload(response: Response): Promise<unknown> {
		const contentType =
			response.headers.get("content-type")?.toLowerCase() ?? "";
		if (contentType.includes("application/json")) return response.json();
		const text = await response.text();
		return text.trim() ? text : null;
	}

	private static buildApiError(status: number, payload: unknown): string {
		const detail = SireSubmissionService.buildPayloadDetails(payload);
		return `SIRE API request failed (${status}): ${detail}`;
	}

	private static buildPayloadDetails(payload: unknown): string {
		const obj = SireSubmissionService.asObject(payload);
		return (
			SireSubmissionService.readStr(obj, [
				"message",
				"error",
				"detail",
				"error_description",
			]) ?? (typeof payload === "string" ? payload : "No details")
		);
	}

	private static mapApiResponse(
		input: SubmitSireInput,
		payload: unknown,
	): SireSubmissionResult {
		const obj = SireSubmissionService.asObject(payload);
		const now = new Date().toISOString();
		const statusRaw =
			SireSubmissionService.readStr(obj, ["status", "estado"]) ?? "RECEIVED";
		const submissionId =
			SireSubmissionService.readStr(obj, [
				"submissionId",
				"id",
				"ticket",
				"numeroTicket",
			]) ?? `SUNAT-${Date.now()}`;

		return {
			submissionId,
			status: SireSubmissionService.normalizeStatus(statusRaw),
			provider: "sunat-api",
			submittedAt:
				SireSubmissionService.readStr(obj, [
					"submittedAt",
					"submitted_at",
					"timestamp",
				]) ?? now,
			period: input.period,
			ledgerType: input.ledgerType,
			dryRun: input.dryRun ?? false,
			message:
				SireSubmissionService.readStr(obj, ["message", "mensaje"]) ??
				"Submission accepted by SIRE API",
			trackingId: SireSubmissionService.readStr(obj, [
				"trackingId",
				"tracking_id",
				"jobId",
			]),
			sunatTicket: SireSubmissionService.readStr(obj, [
				"ticket",
				"numeroTicket",
			]),
		};
	}

	private static normalizeStatus(
		status: string,
	): "ACCEPTED" | "RECEIVED" | "REJECTED" | "SIMULATED" {
		const normalized = status.trim().toUpperCase();
		if (normalized.includes("REJECT")) return "REJECTED";
		if (normalized.includes("ACCEPT")) return "ACCEPTED";
		if (normalized.includes("SIMUL")) return "SIMULATED";
		return "RECEIVED";
	}

	private static asObject(value: unknown): Record<string, unknown> | null {
		if (!value || typeof value !== "object" || Array.isArray(value))
			return null;
		return value as Record<string, unknown>;
	}

	private static readStr(
		payload: Record<string, unknown> | null,
		keys: string[],
	): string | undefined {
		if (!payload) return undefined;
		for (const key of keys) {
			const value = payload[key];
			if (typeof value === "string" && value.trim()) return value.trim();
			if (typeof value === "number" && Number.isFinite(value))
				return value.toString();
		}
		return undefined;
	}
}
