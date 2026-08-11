import type {
	SunatCpeValidationRequest,
	SunatCpeValidationResponse,
} from "../../infrastructure/sunat-cpe-client";

/**
 * SunatVisualFallbackTrace interface.
 *
 * @example
 * ```ts
 * const value: SunatVisualFallbackTrace = {} as SunatVisualFallbackTrace;
 * console.log(value);
 * ```
 */
export interface SunatVisualFallbackTrace {
	source: "visual_subagent";
	mode: "simulation";
	steps: string[];
	txtPreview: string;
	durationMs: number;
}

/**
 * SunatFallbackHitlRequest interface.
 *
 * @example
 * ```ts
 * const value: SunatFallbackHitlRequest = {} as SunatFallbackHitlRequest;
 * console.log(value);
 * ```
 */
export interface SunatFallbackHitlRequest {
	required: true;
	challengeType: "captcha" | "unexpected_popup";
	channel: "whatsapp";
	message: string;
	screenshotRef: string;
}

/**
 * SunatVisualFallbackResult interface.
 *
 * @example
 * ```ts
 * const value: SunatVisualFallbackResult = {} as SunatVisualFallbackResult;
 * console.log(value);
 * ```
 */
export interface SunatVisualFallbackResult {
	response: SunatCpeValidationResponse;
	trace: SunatVisualFallbackTrace;
	hitl?: SunatFallbackHitlRequest | undefined;
}

function parseBoolEnv(raw: string | undefined): boolean {
	if (!raw) return false;
	const normalized = raw.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}

function resolveFallbackMode(): "disabled" | "simulation" {
	const fromEnv = (process.env.SUNAT_AGENTIC_FALLBACK_MODE ?? "simulation")
		.trim()
		.toLowerCase();
	if (fromEnv === "disabled") return "disabled";
	return "simulation";
}

function buildSimulatedTxt(request: SunatCpeValidationRequest): string {
	const tipo = request.cpeNumber.type;
	const serie = request.cpeNumber.serie;
	const numero = request.cpeNumber.numero;
	const monto = request.totalAmount.toFixed(2);

	if (request.ruc.value.startsWith("99999")) {
		return [
			"ESTADO=RECHAZADO",
			"CODIGO=2320",
			"MENSAJE=RUC no válido",
			`RUC=${request.ruc.value}`,
			`CPE=${tipo}|${serie}|${numero}`,
			`MONTO=${monto}`,
		].join("\n");
	}

	if (numero.endsWith("9999")) {
		return [
			"ESTADO=ANULADO",
			"CODIGO=0",
			"MENSAJE=Comprobante anulado",
			`RUC=${request.ruc.value}`,
			`CPE=${tipo}|${serie}|${numero}`,
			`MONTO=${monto}`,
		].join("\n");
	}

	return [
		"ESTADO=ACEPTADO",
		"CODIGO=0",
		"MENSAJE=Comprobante válido",
		`RUC=${request.ruc.value}`,
		`CPE=${tipo}|${serie}|${numero}`,
		`MONTO=${monto}`,
	].join("\n");
}

function shouldRequireHitl(request: SunatCpeValidationRequest): boolean {
	const forced = parseBoolEnv(process.env.SUNAT_AGENTIC_REQUIRE_HITL);
	if (forced) return true;
	return request.cpeNumber.numero.endsWith("7777");
}

function parseTxtResponse(txtPayload: string): SunatCpeValidationResponse {
	const map = new Map<string, string>();
	for (const rawLine of txtPayload.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;
		const eqIndex = line.indexOf("=");
		if (eqIndex < 0) continue;
		const key = line.slice(0, eqIndex).trim().toUpperCase();
		const value = line.slice(eqIndex + 1).trim();
		map.set(key, value);
	}

	const estadoRaw = (map.get("ESTADO") ?? "NO_EXISTE").toUpperCase();
	const estado: SunatCpeValidationResponse["estado"] =
		estadoRaw === "ACEPTADO" ||
		estadoRaw === "RECHAZADO" ||
		estadoRaw === "ANULADO" ||
		estadoRaw === "NO_EXISTE"
			? estadoRaw
			: "NO_EXISTE";

	const codigo = map.get("CODIGO");
	const mensaje = map.get("MENSAJE");
	const observaciones = map
		.get("OBSERVACIONES")
		?.split("|")
		.map((item) => item.trim())
		.filter(Boolean);

    	return {
    		success: estado === "ACEPTADO" || estado === "ANULADO",
    		estado,
    		...(mensaje !== undefined ? { mensaje } : {}),
    		...(codigo !== undefined ? { codigoRespuesta: codigo } : {}),
    		...(observaciones && observaciones.length > 0 ? { observaciones } : {}),
    	};
}

/**
 * Visual fallback subagent for SUNAT outages.
 *
 * Steps simulated (2026 pattern):
 * 1. Open SUNAT portal with vision context
 * 2. Login via Clave SOL
 * 3. Download TXT validation payload
 * 4. Parse TXT locally
 * @example
 * ```ts
 * const value = new SunatVisualFallbackSubagent();
 * console.log(value);
 * ```
 */

export class SunatVisualFallbackSubagent {
	async run(
		request: SunatCpeValidationRequest,
	): Promise<SunatVisualFallbackResult> {
		const startedAt = Date.now();
		const mode = resolveFallbackMode();
		if (mode === "disabled") {
			throw new Error("SUNAT visual fallback is disabled by policy.");
		}

		const steps: string[] = [];
		steps.push("vision-bootstrap");
		steps.push("clave-sol-login");
		steps.push("txt-download");
		steps.push("txt-local-parse");

		const shouldDelay = parseBoolEnv(
			process.env.SUNAT_AGENTIC_FALLBACK_SLOW_MODE,
		);
		if (shouldDelay) {
			await new Promise((resolve) => setTimeout(resolve, 150));
		}

		let hitl: SunatFallbackHitlRequest | undefined;
		if (shouldRequireHitl(request)) {
			steps.push("hitl-pause");
			hitl = {
				required: true,
				challengeType: "captcha",
				channel: "whatsapp",
				message:
					"SUNAT solicito captcha inesperado. Requiere apoyo humano para continuar.",
				screenshotRef: `sunat-hitl-${request.cpeNumber.serie}-${request.cpeNumber.numero}.png`,
			};
		}

		const txtPayload = buildSimulatedTxt(request);
		const response = parseTxtResponse(txtPayload);

		return {
			response,
			trace: {
				source: "visual_subagent",
				mode,
				steps,
				txtPreview: txtPayload.slice(0, 220),
				durationMs: Date.now() - startedAt,
			},
			hitl,
		};
	}
}
