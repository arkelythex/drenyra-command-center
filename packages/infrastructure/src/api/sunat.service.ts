/**
 * SUNAT API Service
 *
 * Connects to SUNAT web services for RUC validation and invoice verification.
 * Uses the free APIs available from Peru.
 *
 * @since 2026 Gemini Brain Standard
 * Información básica de un contribuyente consultada por RUC.
 *
 * @example
 * ```ts
 * const info: RucInfo = {
 *   ruc: "20123456789",
 *   razonSocial: "ACME S.A.C.",
 *   estado: "ACTIVO",
 *   condicion: "HABIDO",
 *   tipo: "PERSONA JURIDICA",
 * };
 * ```
 */

import type { RucInfo } from "../../sunat/types";

/**
 * Resultado de verificación (básica) de un comprobante en SUNAT.
 *
 * @example
 * ```ts
 * const result: InvoiceVerification = {
 *   esValido: true,
 *   rucEmisor: "20123456789",
 *   tipoComprobante: "Factura",
 *   serie: "F001",
 *   numero: "1234",
 *   estado: "ACEPTADO",
 *   mensaje: "Formato válido.",
 * };
 * ```
 */
export interface InvoiceVerification {
	esValido: boolean;
	rucEmisor: string;
	tipoComprobante: string;
	serie: string;
	numero: string;
	fechaEmision?: string;
	estado: "ACEPTADO" | "RECHAZADO" | "PENDIENTE" | string;
	mensaje: string;
	montoTotal?: number;
}

// ============================================
// SUNAT RUC API
// ============================================

/**
 * Validate RUC with SUNAT
 *
 * Uses the APIs Peru service (free tier available)
 * @see https://apis.net.pe/api-consulta-ruc
 *
 * @param ruc - RUC de 11 dígitos (debe iniciar con `10` o `20`).
 * @returns Información del RUC (o un fallback si no hay token configurado).
 * @throws {Error} Si el RUC no cumple formato o si ocurre un error consultando.
 *
 * @example
 * ```ts
 * const info = await consultarRucSunat("20123456789");
 * console.log(info.razonSocial);
 * ```
 */
export async function consultarRucSunat(ruc: string): Promise<RucInfo> {
	// Validate RUC format
	if (!/^\d{11}$/.test(ruc)) {
		throw new Error("RUC debe tener 11 dígitos");
	}

	const isPersona = ruc.startsWith("10");
	const isEmpresa = ruc.startsWith("20");

	if (!isPersona && !isEmpresa) {
		throw new Error(
			"RUC inválido: debe iniciar con 10 (persona) o 20 (empresa)",
		);
	}

	try {
		// Try APIs Peru (free tier: 20 requests/day)
		// You need to register at https://apis.net.pe to get a token
		const apiToken = process.env.APIS_PERU_TOKEN;

		if (apiToken) {
			const response = await fetch(
				`https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`,
				{
					headers: {
						Authorization: `Bearer ${apiToken}`,
						Accept: "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				return {
					ruc: data.numeroDocumento || ruc,
					razonSocial: data.razonSocial || data.nombre || "No disponible",
					nombreComercial: data.nombreComercial,
					estado: data.estado || "DESCONOCIDO",
					condicion: data.condicion || "DESCONOCIDO",
					direccion: data.direccion,
					ubigeo: data.ubigeo,
					tipo: isEmpresa ? "PERSONA JURIDICA" : "PERSONA NATURAL",
					fechaInscripcion: data.fechaInscripcion,
					fechaInicioActividades: data.fechaInicioActividades,
					actividadEconomica: data.actividadEconomica,
				};
			}
		}

		// Fallback: Basic validation without external API
		console.warn("[SUNAT API] No token configured, using fallback validation");
		return {
			ruc,
			razonSocial: "Consulta pendiente (configure APIS_PERU_TOKEN)",
			estado: "PENDIENTE",
			condicion: "PENDIENTE",
			tipo: isEmpresa ? "PERSONA JURIDICA" : "PERSONA NATURAL",
		};
	} catch (error) {
		console.error("[SUNAT API] Error:", error);
		throw new Error(
			`Error consultando SUNAT: ${error instanceof Error ? error.message : "Error desconocido"}`,
		);
	}
}

/**
 * Validate RUC checksum (Peruvian algorithm)
 *
 * @param ruc - RUC de 11 dígitos.
 * @returns `true` si el dígito verificador coincide, `false` en caso contrario.
 *
 * @example
 * ```ts
 * const ok = validarDigitoVerificadorRuc("20123456789");
 * ```
 */
export function validarDigitoVerificadorRuc(ruc: string): boolean {
	if (!/^\d{11}$/.test(ruc)) return false;

	const digits = ruc.split("").map(Number);
	const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

	let sum = 0;
	for (let i = 0; i < 10; i++) {
		const digit = digits[i] ?? 0;
		const weight = weights[i] ?? 1;
		sum += digit * weight;
	}

	const remainder = sum % 11;
	const checkDigit = 11 - remainder;
	const expectedDigit =
		checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;
	const lastDigit = digits[10] ?? -1;

	return lastDigit === expectedDigit;
}

// ============================================
// SUNAT INVOICE VERIFICATION (CDR)
// ============================================

/**
 * Verify invoice with SUNAT CDR
 *
 * Note: Full CDR verification requires enterprise credentials.
 * This provides basic validation.
 *
 * @param rucEmisor - RUC del emisor (11 dígitos).
 * @param tipo - Tipo de comprobante (`01` factura, `03` boleta, `07` NC, `08` ND).
 * @param serie - Serie del comprobante (ej. `F001` / `B001`).
 * @param numero - Número correlativo (texto, para preservar ceros a la izquierda si aplica).
 * @returns Resultado de verificación básica de formato.
 * @throws {Error} Si el RUC del emisor no es válido.
 *
 * @example
 * ```ts
 * const result = await verificarComprobanteSunat("20123456789", "01", "F001", "1234");
 * console.log(result.esValido);
 * ```
 */
export async function verificarComprobanteSunat(
	rucEmisor: string,
	tipo: "01" | "03" | "07" | "08",
	serie: string,
	numero: string,
): Promise<InvoiceVerification> {
	// Validate inputs
	if (!/^\d{11}$/.test(rucEmisor)) {
		throw new Error("RUC emisor inválido");
	}

	const tipoDescripcion: Record<string, string> = {
		"01": "Factura",
		"03": "Boleta de Venta",
		"07": "Nota de Crédito",
		"08": "Nota de Débito",
	};

	const descripcion = tipoDescripcion[tipo] ?? "Comprobante";

	// Basic format validation
	const seriePattern =
		tipo === "01" || tipo === "07" || tipo === "08" ? /^F\d{3}$/ : /^B\d{3}$/;
	if (!seriePattern.test(serie.toUpperCase())) {
		return {
			esValido: false,
			rucEmisor,
			tipoComprobante: descripcion,
			serie,
			numero,
			estado: "RECHAZADO",
			mensaje: `Serie inválida para ${descripcion}. Debe ser ${tipo === "01" ? "Fxxx" : "Bxxx"}`,
		};
	}

	// Validate RUC checksum
	if (!validarDigitoVerificadorRuc(rucEmisor)) {
		return {
			esValido: false,
			rucEmisor,
			tipoComprobante: descripcion,
			serie,
			numero,
			estado: "RECHAZADO",
			mensaje: "RUC emisor tiene dígito verificador inválido",
		};
	}

	// For full CDR verification, you need SUNAT credentials
	// This is a basic validation response
	return {
		esValido: true,
		rucEmisor,
		tipoComprobante: descripcion,
		serie: serie.toUpperCase(),
		numero,
		estado: "ACEPTADO",
		mensaje: `Formato válido. Para verificación completa, consulte el portal SUNAT.`,
	};
}

// ============================================
// DNI VALIDATION
// ============================================

/**
 * Validate DNI format
 *
 * @param dni - DNI de 8 dígitos.
 * @returns `true` si el formato es válido, `false` si no.
 *
 * @example
 * ```ts
 * const ok = validarDni("12345678");
 * ```
 */
export function validarDni(dni: string): boolean {
	return /^\d{8}$/.test(dni);
}

/**
 * Lookup DNI information
 *
 * Uses APIs Peru service
 *
 * @param dni - DNI de 8 dígitos.
 * @returns Datos de RENIEC (o fallback si no hay token configurado).
 * @throws {Error} Si el DNI no cumple formato o si ocurre un error consultando.
 *
 * @example
 * ```ts
 * const info = await consultarDni("12345678");
 * console.log(info.nombreCompleto);
 * ```
 */
export async function consultarDni(dni: string): Promise<{
	dni: string;
	nombres: string;
	apellidoPaterno: string;
	apellidoMaterno: string;
	nombreCompleto: string;
}> {
	if (!validarDni(dni)) {
		throw new Error("DNI debe tener 8 dígitos");
	}

	try {
		const apiToken = process.env.APIS_PERU_TOKEN;

		if (apiToken) {
			const response = await fetch(
				`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`,
				{
					headers: {
						Authorization: `Bearer ${apiToken}`,
						Accept: "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				return {
					dni,
					nombres: data.nombres || "",
					apellidoPaterno: data.apellidoPaterno || "",
					apellidoMaterno: data.apellidoMaterno || "",
					nombreCompleto:
						`${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
				};
			}
		}

		// Fallback
		return {
			dni,
			nombres: "",
			apellidoPaterno: "",
			apellidoMaterno: "",
			nombreCompleto: "Consulta pendiente (configure APIS_PERU_TOKEN)",
		};
	} catch (error) {
		console.error("[DNI API] Error:", error);
		throw new Error(
			`Error consultando DNI: ${error instanceof Error ? error.message : "Error desconocido"}`,
		);
	}
}
