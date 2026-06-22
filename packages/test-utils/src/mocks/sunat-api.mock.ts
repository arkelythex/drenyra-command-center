/**
 * Mock factory for SUNAT API responses.
 *
 * Provides realistic mock responses for SUNAT's OSE/PSE services,
 * including CDR (Constancia de Recepción) generation.
 *
 * @example
 * ```ts
 * const mock = createSunatMock();
 * mock.sendInvoice.mockResolvedValue(sunatMocks.success());
 * ```
 */
import { vi } from "vitest";
import type { SunatResponse } from "./types";

export function createSunatMock() {
	return {
		/**
		 * Mock for the main SUNAT API client.
		 */
		sendInvoice: vi.fn<() => Promise<SunatResponse>>(),
		getStatus: vi.fn<() => Promise<SunatResponse>>(),
		queryCDR: vi.fn<() => Promise<SunatResponse>>(),
		validateRUC:
			vi.fn<
				() => Promise<{ valid: boolean; info?: Record<string, unknown> }>
			>(),
	};
}

/**
 * Pre-built SUNAT success response.
 */
export function sunatSuccess(
	overrides?: Partial<SunatResponse>,
): SunatResponse {
	return {
		ticket: `TK-${Date.now()}`,
		status: "accepted",
		cdrCode: "0",
		cdrDescription: "El comprobante ha sido aceptado",
		responseDate: new Date(),
		...overrides,
	};
}

/**
 * Pre-built SUNAT rejection response.
 */
export function sunatRejection(
	overrides?: Partial<SunatResponse>,
): SunatResponse {
	return {
		ticket: `TK-${Date.now()}`,
		status: "rejected",
		cdrCode: "3076",
		cdrDescription: "El RUC del cliente no existe en la base de datos de SUNAT",
		errorMessage: "RUC no encontrado",
		responseDate: new Date(),
		...overrides,
	};
}

/**
 * Pre-built SUNAT pending response.
 */
export function sunatPending(
	overrides?: Partial<SunatResponse>,
): SunatResponse {
	return {
		ticket: `TK-${Date.now()}`,
		status: "pending",
		responseDate: new Date(),
		...overrides,
	};
}

/**
 * Pre-built SUNAT error response.
 */
export function sunatError(overrides?: Partial<SunatResponse>): SunatResponse {
	return {
		status: "error",
		errorMessage: "Error de conexión con SUNAT",
		...overrides,
	};
}

/**
 * Pre-built RUC validation success response.
 */
export function rucValidationSuccess(ruc = "20601234567") {
	return {
		valid: true,
		info: {
			ruc,
			razonSocial: "EMPRESA DE PRUEBA SAC",
			estado: "ACTIVO",
			condicion: "HABIDO",
			direccion: "AV. TEST 123, LIMA",
		},
	};
}

/**
 * Pre-built RUC validation failure response.
 */
export function rucValidationFailure() {
	return {
		valid: false,
		info: undefined,
	};
}

// ============================================================
// CDR STATUS VARIANTS
// ============================================================

/**
 * Description lookup for SUNAT observación codes (1-6).
 */
const OBSERVACION_DESCRIPTIONS: Record<string, string> = {
	"1": "El RUC del emisor no se encuentra activo",
	"2": "El RUC del cliente no se encuentra activo",
	"3": "La serie del comprobante no corresponde al tipo",
	"4": "El número de comprobante ya fue registrado",
	"5": "El monto total no coincide con el calculado",
	"6": "La fecha de emisión no es válida",
};

/**
 * Pre-built SUNAT observación response.
 *
 * Simulates a CDR where SUNAT accepted the document but found observaciones
 * (observations) that don't prevent processing but indicate issues.
 *
 * @param cdrCode - Observación code: "1" through "6"
 *
 * @example
 * ```ts
 * const response = sunatObservacion("2");
 * // { status: "rejected", cdrCode: "2", cdrDescription: "El RUC del cliente no se encuentra activo" }
 * ```
 */
export function sunatObservacion(
	cdrCode: "1" | "2" | "3" | "4" | "5" | "6",
): SunatResponse {
	return {
		ticket: `TK-${Date.now()}`,
		status: "rejected",
		cdrCode,
		cdrDescription:
			OBSERVACION_DESCRIPTIONS[cdrCode] ??
			"Observación no especificada",
		errorMessage: `Observación código ${cdrCode}: ${OBSERVACION_DESCRIPTIONS[cdrCode] ?? "Desconocida"}`,
		responseDate: new Date(),
	};
}

/**
 * Pre-built SUNAT hard rejection response.
 *
 * Simulates a CDR with a hard error (code 7+), where SUNAT
 * rejects the document outright with an error code and message.
 *
 * @param cdrCode - Hard rejection code (e.g., "3076", "3099")
 *
 * @example
 * ```ts
 * const response = sunatHardRejection("3076");
 * // { status: "rejected", cdrCode: "3076", errorMessage: "El RUC del cliente no existe..." }
 * ```
 */
export function sunatHardRejection(cdrCode: string): SunatResponse {
	const messages: Record<string, string> = {
		"3076": "El RUC del cliente no existe en la base de datos de SUNAT",
		"3099": "El comprobante no cumple con las validaciones de SUNAT",
		"3100": "Error interno en el procesamiento de SUNAT",
		"3150": "La firma digital del comprobante no es válida",
	};

	return {
		ticket: `TK-${Date.now()}`,
		status: "rejected",
		cdrCode,
		cdrDescription:
			messages[cdrCode] ?? "Error no especificado en la validación de SUNAT",
		errorMessage:
			messages[cdrCode] ??
			`Error SUNAT código ${cdrCode}`,
		responseDate: new Date(),
	};
}

/**
 * Pre-built SUNAT timeout simulation.
 *
 * Returns a promise that rejects with a timeout error after the
 * specified delay. Use with fake timers or real async waits.
 *
 * @param delayMs - Delay in milliseconds before rejecting
 *
 * @example
 * ```ts
 * // Real async test
 * await expect(sunatTimeout(100)).rejects.toThrow("SUNAT timeout");
 *
 * // With fake timers
 * vi.useFakeTimers();
 * const promise = sunatTimeout(5000);
 * vi.advanceTimersByTime(5000);
 * await expect(promise).rejects.toThrow("SUNAT timeout");
 * ```
 */
export function sunatTimeout(delayMs: number): Promise<SunatResponse> {
	return new Promise((_, reject) => {
		setTimeout(() => {
			reject(
				new Error(
					`SUNAT timeout after ${delayMs}ms: El servicio de SUNAT no respondió dentro del tiempo esperado`,
				),
			);
		}, delayMs);
	});
}
