/**
 * SUNAT CPE Client
 * Validates CPE against SUNAT's validation API
 *
 * Endpoint: https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/{ruc}/validarcomprobante
 *
 * @see https://cpe.sunat.gob.pe/sites/default/files/inline-files/Manual-de-Consulta-Integrada-de-Comprobante-de-Pago-por-ServicioWEB_v2_0.pdf
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findSunatCatalogEntry } from "../domain/sunat-code-catalog";
import type { CpeNumber } from "../domain/value-objects/cpe-number.vo";
import type { Ruc } from "../domain/value-objects/ruc.vo";
import type { ValidationError } from "../domain/value-objects/validation-result.vo";

/**
 * SunatCpeValidationRequest interface.
 *
 * @example
 * ```ts
 * const value: SunatCpeValidationRequest = {} as SunatCpeValidationRequest;
 * console.log(value);
 * ```
 */
export interface SunatCpeValidationRequest {
	ruc: Ruc;
	cpeNumber: CpeNumber;
	issueDate: string; // YYYY-MM-DD
	totalAmount: number;
}

/**
 * SunatCpeValidationResponse interface.
 *
 * @example
 * ```ts
 * const value: SunatCpeValidationResponse = {} as SunatCpeValidationResponse;
 * console.log(value);
 * ```
 */
export interface SunatCpeValidationResponse {
	success: boolean;
	estado: "ACEPTADO" | "OBSERVADO" | "RECHAZADO" | "ANULADO" | "NO_EXISTE";
	mensaje?: string | undefined;
	codigoRespuesta?: string | undefined;
	observaciones?: string[] | undefined;
	mode?: SunatCpeValidationMode | undefined;
}

type SunatCpeValidationMode = "sandbox" | "replay" | "real";

type ReplayFixtureCatalog = Record<string, SunatCpeValidationResponse>;

/**
 * SunatCpeClient class.
 *
 * @example
 * ```ts
 * const value = new SunatCpeClient();
 * console.log(value);
 * ```
 */
export class SunatCpeClient {
	private readonly baseUrl: string;
	private readonly timeout: number;

	constructor() {
		this.baseUrl = process.env.SUNAT_API_BASE_URL ?? "https://api.sunat.gob.pe";
		this.timeout = Number(process.env.SUNAT_API_TIMEOUT_MS ?? 4500);
	}

	/**
	 * Validate CPE against SUNAT API
	 *
	 * MVP: Simulation mode (returns mock response)
	 * Production: Real API call with OAuth token
	 */
	async validate(
		request: SunatCpeValidationRequest,
	): Promise<SunatCpeValidationResponse> {
		if (process.env.SUNAT_CPE_FORCE_TIMEOUT?.trim().toLowerCase() === "true") {
			throw new Error("SUNAT_API_TIMEOUT");
		}

		switch (this.resolveValidationMode()) {
			case "sandbox":
				return this.validateWithSandboxRules(request);
			case "replay":
				return this.validateFromReplayFixture(request);
			case "real":
				return this.validateWithRealApi(request);
		}
	}

	private resolveValidationMode(): SunatCpeValidationMode {
		const normalized = (process.env.SUNAT_CPE_VALIDATION_MODE ?? "sandbox")
			.trim()
			.toLowerCase();

		if (normalized === "simulation" || normalized === "sandbox") {
			return "sandbox";
		}

		if (normalized === "replay") {
			return "replay";
		}

		return "real";
	}

	private validateWithSandboxRules(
		request: SunatCpeValidationRequest,
	): SunatCpeValidationResponse {
		const isInvalidRuc = request.ruc.value.startsWith("99999");
		const isMissing = request.cpeNumber.numero.endsWith("6666");
		const isAnulado = request.cpeNumber.numero.endsWith("9999");
		const isObserved = request.cpeNumber.numero.endsWith("7777");

		if (isInvalidRuc) {
			return {
				success: false,
				estado: "RECHAZADO",
				mensaje: "RUC no válido",
				codigoRespuesta: "2320",
				mode: "sandbox",
			};
		}

		if (isObserved) {
			return {
				success: true,
				estado: "OBSERVADO",
				mensaje: "Comprobante observado en sandbox",
				codigoRespuesta: "0101",
				observaciones: [
					"Se detectaron observaciones previas al envío.",
					"Revisar totales y tributos antes de enviar a SUNAT.",
				],
				mode: "sandbox",
			};
		}

		if (isMissing) {
			return {
				success: false,
				estado: "NO_EXISTE",
				mensaje: "Comprobante no encontrado en sandbox",
				codigoRespuesta: "4040",
				mode: "sandbox",
			};
		}

		if (isAnulado) {
			return {
				success: true,
				estado: "ANULADO",
				mensaje: "Comprobante anulado",
				mode: "sandbox",
			};
		}

		return {
			success: true,
			estado: "ACEPTADO",
			mensaje: "Comprobante válido",
			mode: "sandbox",
		};
	}

	private validateFromReplayFixture(
		request: SunatCpeValidationRequest,
	): SunatCpeValidationResponse {
		const fixtureCatalog = this.loadReplayFixtureCatalog();
		const replayKey = this.resolveReplayKey(request);
		const fixture = fixtureCatalog[replayKey] ?? fixtureCatalog.accepted;

		if (!fixture) {
			throw new Error(`Missing SUNAT CPE replay fixture: ${replayKey}`);
		}

		return {
			...fixture,
			observaciones: fixture.observaciones
				? [...fixture.observaciones]
				: undefined,
			mode: "replay",
		};
	}

	private loadReplayFixtureCatalog(): ReplayFixtureCatalog {
		const defaultFixturePath = fileURLToPath(
			new URL("../fixtures/sunat-cpe-replay.json", import.meta.url),
		);
		const fixturePath = process.env.SUNAT_CPE_REPLAY_FIXTURE_PATH?.trim()
			? path.resolve(process.cwd(), process.env.SUNAT_CPE_REPLAY_FIXTURE_PATH)
			: defaultFixturePath;
		const raw = readFileSync(fixturePath, "utf8");
		return JSON.parse(raw) as ReplayFixtureCatalog;
	}

	private resolveReplayKey(request: SunatCpeValidationRequest): string {
		if (request.ruc.value.startsWith("99999")) {
			return "rejected";
		}

		if (request.cpeNumber.numero.endsWith("6666")) {
			return "missing";
		}

		if (request.cpeNumber.numero.endsWith("9999")) {
			return "annulled";
		}

		if (request.cpeNumber.numero.endsWith("7777")) {
			return "observed";
		}

		return "accepted";
	}

	private async validateWithRealApi(
		request: SunatCpeValidationRequest,
	): Promise<SunatCpeValidationResponse> {
		const token = (process.env.SUNAT_CPE_API_TOKEN ?? "").trim();
		if (!token) {
			throw new Error(
				"SUNAT_CPE_API_TOKEN is required for real mode (Clave SOL / beta credentials).",
			);
		}

		let response: Response;
		try {
			response = await fetch(
				`${this.baseUrl}/v1/contribuyente/contribuyentes/${request.ruc.value}/validarcomprobante`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						numRuc: request.ruc.value,
						codComp: this.getCpeTypeCode(request.cpeNumber.type),
						numeroSerie: request.cpeNumber.serie,
						numero: request.cpeNumber.numero,
						fechaEmision: request.issueDate,
						monto: request.totalAmount,
					}),
					signal: AbortSignal.timeout(this.timeout),
				},
			);
		} catch (error: unknown) {
			if (error instanceof Error && error.name === "TimeoutError") {
				throw new Error("SUNAT_API_TIMEOUT");
			}
			throw new Error(
				`SUNAT_API_NETWORK_ERROR: ${
					error instanceof Error ? error.message : "unknown"
				}`,
			);
		}

		const payloadText = await response.text();
		let payload: Record<string, unknown> = {};

		if (payloadText.trim().length > 0) {
			try {
				payload = JSON.parse(payloadText) as Record<string, unknown>;
			} catch {
				payload = { mensaje: payloadText.trim() };
			}
		}

		if (!response.ok) {
			const message = this.extractMessage(payload) ?? response.statusText;
			throw new Error(`SUNAT_API_${response.status}: ${message}`);
		}

		return this.normalizeRealResponse(payload);
	}

	private normalizeRealResponse(
		payload: Record<string, unknown>,
	): SunatCpeValidationResponse {
		const rawEstado = (
			this.readString(payload, "estado") ??
			this.readString(payload, "status") ??
			"NO_EXISTE"
		).toUpperCase();

		const estado: SunatCpeValidationResponse["estado"] =
			rawEstado === "ACEPTADO" ||
			rawEstado === "OBSERVADO" ||
			rawEstado === "RECHAZADO" ||
			rawEstado === "ANULADO" ||
			rawEstado === "NO_EXISTE"
				? rawEstado
				: "NO_EXISTE";

		return {
			success:
				estado === "ACEPTADO" || estado === "ANULADO" || estado === "OBSERVADO",
			estado,
			mensaje:
				this.readString(payload, "mensaje") ??
				this.readString(payload, "message") ??
				undefined,
			codigoRespuesta:
				this.readString(payload, "codigoRespuesta") ??
				this.readString(payload, "code") ??
				undefined,
			observaciones: this.readStringArray(payload, "observaciones"),
			mode: "real",
		};
	}

	private extractMessage(payload: Record<string, unknown>): string | null {
		return (
			this.readString(payload, "mensaje") ??
			this.readString(payload, "message") ??
			null
		);
	}

	private readString(
		payload: Record<string, unknown>,
		key: string,
	): string | undefined {
		const value = payload[key];
		return typeof value === "string" && value.trim().length > 0
			? value.trim()
			: undefined;
	}

	private readStringArray(
		payload: Record<string, unknown>,
		key: string,
	): string[] | undefined {
		const value = payload[key];
		if (!Array.isArray(value)) {
			return undefined;
		}

		const normalized = value
			.filter((item): item is string => typeof item === "string")
			.map((item) => item.trim())
			.filter(Boolean);

		return normalized.length > 0 ? normalized : undefined;
	}

	private getCpeTypeCode(type: string): string {
		const codes: Record<string, string> = {
			FACTURA: "01",
			BOLETA: "03",
			NOTA_CREDITO: "07",
			NOTA_DEBITO: "08",
		};

		return codes[type] ?? "01";
	}

	/**
	 * Map SUNAT response to validation errors
	 */
	mapToErrors(response: SunatCpeValidationResponse): ValidationError[] | null {
		if (response.success && response.estado === "ACEPTADO") {
			return null;
		}

		const errors: ValidationError[] = [];
		const knownIssue = findSunatCatalogEntry(
			response.estado,
			response.codigoRespuesta,
		);

		if (response.estado === "RECHAZADO") {
			errors.push({
				code: response.codigoRespuesta ?? knownIssue?.code ?? "SUNAT_REJECTED",
				message:
					response.mensaje ??
					knownIssue?.defaultErrorMessage ??
					"SUNAT rejected the CPE",
			});
		}

		if (response.estado === "OBSERVADO") {
			errors.push({
				code: response.codigoRespuesta ?? knownIssue?.code ?? "SUNAT_OBSERVED",
				message:
					response.mensaje ??
					knownIssue?.defaultErrorMessage ??
					"SUNAT observed the CPE",
			});
		}

		if (response.estado === "ANULADO") {
			errors.push({
				code: response.codigoRespuesta ?? knownIssue?.code ?? "SUNAT_ANNULLED",
				message:
					response.mensaje ??
					knownIssue?.defaultErrorMessage ??
					"SUNAT reports the CPE as annulled",
			});
		}

		if (response.estado === "NO_EXISTE") {
			errors.push({
				code: response.codigoRespuesta ?? knownIssue?.code ?? "SUNAT_NOT_FOUND",
				message:
					response.mensaje ??
					knownIssue?.defaultErrorMessage ??
					"SUNAT does not recognize this CPE",
			});
		}

		if (response.observaciones) {
			for (const obs of response.observaciones) {
				errors.push({
					code: "SUNAT_OBSERVATION",
					message: obs,
				});
			}
		}

		return errors;
	}
}
