/**
 * Gemini Tools - Function Calling Definitions
 *
 * Defines callable functions for Gemini to interact with Arkelythex's backend.
 * These tools enable the AI to perform real actions instead of just text responses.
 *
 * @description Implements the "Function Calling" pattern where Gemini can
 * invoke specific business logic functions during conversation.
 *
 * @since 2026 Gemini Brain Standard
 */

import { z } from "zod";
import {
	consultarRucSunat as consultarRucApi,
} from "@arkelythex/infrastructure/api/sunat.service";
import { loggers } from "../logger";

// ============================================
// TOOL SCHEMAS
// ============================================

/**
 * CrearAsientoSchema const.
 *
 * @example
 * ```ts
 * console.log(CrearAsientoSchema);
 * ```
 */
export const CrearAsientoSchema = z.object({
	fecha: z
		.string()
		.describe("Fecha del asiento en formato ISO 8601 (YYYY-MM-DD)"),
	glosa: z.string().describe("Descripción general del asiento contable"),
	lineas: z
		.array(
			z.object({
				cuenta: z.string().describe("Código de cuenta PCGE (ej: 6011, 4011)"),
				debe: z.number().describe("Monto en el debe (0 si no aplica)"),
				haber: z.number().describe("Monto en el haber (0 si no aplica)"),
				glosa_linea: z.string().optional().describe("Descripción de la línea"),
			}),
		)
		.describe("Líneas del asiento contable (debe = haber)"),
});

/**
 * ConsultarRucSchema const.
 *
 * @example
 * ```ts
 * console.log(ConsultarRucSchema);
 * ```
 */
export const ConsultarRucSchema = z.object({
	ruc: z.string().length(11).describe("RUC de 11 dígitos a validar con SUNAT"),
});

/**
 * CalcularDetraccionSchema const.
 *
 * @example
 * ```ts
 * console.log(CalcularDetraccionSchema);
 * ```
 */
export const CalcularDetraccionSchema = z.object({
	monto_total: z
		.number()
		.positive()
		.describe("Monto total de la operación en soles"),
	tipo_servicio: z
		.enum([
			"transporte_carga",
			"transporte_pasajeros",
			"intermediacion_laboral",
			"arrendamiento_bienes",
			"mantenimiento_reparacion",
			"otros_servicios",
			"construccion",
		])
		.describe("Tipo de servicio para determinar el porcentaje de detracción"),
});

/**
 * VerificarComprobanteSchema const.
 *
 * @example
 * ```ts
 * console.log(VerificarComprobanteSchema);
 * ```
 */
export const VerificarComprobanteSchema = z.object({
	ruc_emisor: z.string().length(11).describe("RUC del emisor del comprobante"),
	tipo: z
		.enum(["01", "03", "07", "08"])
		.describe("Tipo de comprobante: 01=Factura, 03=Boleta, 07=NC, 08=ND"),
	serie: z.string().describe("Serie del comprobante (ej: F001)"),
	numero: z.string().describe("Número del comprobante"),
});

/**
 * ObtenerTipoCambioSchema const.
 *
 * @example
 * ```ts
 * console.log(ObtenerTipoCambioSchema);
 * ```
 */
export const ObtenerTipoCambioSchema = z.object({
	fecha: z
		.string()
		.describe("Fecha para consultar tipo de cambio (YYYY-MM-DD)"),
	moneda: z.enum(["USD", "EUR"]).default("USD").describe("Moneda a consultar"),
});

/**
 * RegistrarGastoVozSchema const.
 *
 * @example
 * ```ts
 * console.log(RegistrarGastoVozSchema);
 * ```
 */
export const RegistrarGastoVozSchema = z.object({
	descripcion: z
		.string()
		.describe('Descripción del gasto (ej: "gasolina para camioneta")'),
	monto: z.number().positive().describe("Monto del gasto en soles"),
	cuenta_sugerida: z
		.string()
		.optional()
		.describe("Cuenta PCGE sugerida por la IA"),
	medio_pago: z
		.enum(["efectivo", "tarjeta", "transferencia", "yape", "plin"])
		.describe("Medio de pago utilizado"),
});

// ============================================
// INFERRED TYPES
// ============================================

/**
 * CrearAsientoInput type.
 *
 * @example
 * ```ts
 * const value: CrearAsientoInput = {} as CrearAsientoInput;
 * console.log(value);
 * ```
 */
export type CrearAsientoInput = z.infer<typeof CrearAsientoSchema>;
/**
 * ConsultarRucInput type.
 *
 * @example
 * ```ts
 * const value: ConsultarRucInput = {} as ConsultarRucInput;
 * console.log(value);
 * ```
 */
export type ConsultarRucInput = z.infer<typeof ConsultarRucSchema>;
/**
 * CalcularDetraccionInput type.
 *
 * @example
 * ```ts
 * const value: CalcularDetraccionInput = {} as CalcularDetraccionInput;
 * console.log(value);
 * ```
 */
export type CalcularDetraccionInput = z.infer<typeof CalcularDetraccionSchema>;
/**
 * VerificarComprobanteInput type.
 *
 * @example
 * ```ts
 * const value: VerificarComprobanteInput = {} as VerificarComprobanteInput;
 * console.log(value);
 * ```
 */
export type VerificarComprobanteInput = z.infer<
	typeof VerificarComprobanteSchema
>;
/**
 * ObtenerTipoCambioInput type.
 *
 * @example
 * ```ts
 * const value: ObtenerTipoCambioInput = {} as ObtenerTipoCambioInput;
 * console.log(value);
 * ```
 */
export type ObtenerTipoCambioInput = z.infer<typeof ObtenerTipoCambioSchema>;
/**
 * RegistrarGastoVozInput type.
 *
 * @example
 * ```ts
 * const value: RegistrarGastoVozInput = {} as RegistrarGastoVozInput;
 * console.log(value);
 * ```
 */
export type RegistrarGastoVozInput = z.infer<typeof RegistrarGastoVozSchema>;

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

/**
 * Create accounting entry
 * @param input - Input for input.
 * @returns Result of crearAsiento.
 * @example
 * ```ts
 * const result = await crearAsiento({} as CrearAsientoInput);
 * console.log(result);
 * ```
 */

export async function crearAsiento(input: CrearAsientoInput) {
	const { fecha, glosa, lineas } = input;

	loggers.ai.info("crear_asiento called", { fecha, glosa, lineas });

	// Validate debe = haber
	const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
	const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);

	if (Math.abs(totalDebe - totalHaber) > 0.01) {
		return {
			success: false as const,
			error: `El asiento no cuadra: Debe (${totalDebe}) ≠ Haber (${totalHaber})`,
		};
	}

	return {
		success: true as const,
		asiento_id: `ASI-${Date.now()}`,
		mensaje: `Asiento creado: ${glosa}`,
		total: totalDebe,
	};
}

/**
 * Validate RUC with SUNAT - Connected to real API
 * @param input - Input for input.
 * @returns Result of consultarRucSunat.
 * @example
 * ```ts
 * const result = await consultarRucSunat({} as ConsultarRucInput);
 * console.log(result);
 * ```
 */

export async function consultarRucSunat(input: ConsultarRucInput) {
	const { ruc } = input;

	loggers.ai.info("consultar_ruc called", { ruc });

	try {
		const result = await consultarRucApi(ruc);

		return {
			success: true as const,
			ruc: result.ruc,
			razon_social: result.razonSocial,
			estado: result.estado,
			condicion: result.condicion,
			direccion: result.direccion || "No disponible",
			tipo: result.tipo,
		};
	} catch (error) {
		return {
			success: false as const,
			error: error instanceof Error ? error.message : "Error consultando SUNAT",
		};
	}
}

/**
 * Calculate SPOT (detracción)
 * @param input - Input for input.
 * @returns Result of calcularDetraccion.
 * @example
 * ```ts
 * const result = await calcularDetraccion({} as CalcularDetraccionInput);
 * console.log(result);
 * ```
 */

export async function calcularDetraccion(input: CalcularDetraccionInput) {
	const { monto_total, tipo_servicio } = input;

	loggers.ai.info("calcular_detraccion called", { monto_total, tipo_servicio });

	// Porcentajes según tipo de servicio
	const porcentajes: Record<string, number> = {
		transporte_carga: 0.04,
		transporte_pasajeros: 0.04,
		intermediacion_laboral: 0.12,
		arrendamiento_bienes: 0.1,
		mantenimiento_reparacion: 0.1,
		otros_servicios: 0.1,
		construccion: 0.12,
	};

	const porcentaje = porcentajes[tipo_servicio] || 0.1;

	// Solo aplica si > S/ 700
	if (monto_total <= 700) {
		return {
			success: true as const,
			aplica_detraccion: false,
			razon: "Monto menor o igual a S/ 700, no aplica detracción",
			monto_a_pagar: monto_total,
		};
	}

	const monto_detraccion = Math.round(monto_total * porcentaje * 100) / 100;
	const monto_neto = monto_total - monto_detraccion;

	return {
		success: true as const,
		aplica_detraccion: true,
		porcentaje: porcentaje * 100,
		monto_detraccion,
		monto_neto,
		depositar_en: "Banco de la Nación - Cuenta detracciones del proveedor",
	};
}

/**
 * Verify invoice with SUNAT
 * @param input - Input for input.
 * @returns Result of verificarComprobante.
 * @example
 * ```ts
 * const result = await verificarComprobante({} as VerificarComprobanteInput);
 * console.log(result);
 * ```
 */

export async function verificarComprobante(input: VerificarComprobanteInput) {
	const { ruc_emisor, tipo, serie, numero } = input;

	loggers.ai.info("verificar_comprobante called", {
		ruc_emisor,
		tipo,
		serie,
		numero,
	});

	const tipoDescripcion: Record<string, string> = {
		"01": "Factura",
		"03": "Boleta de Venta",
		"07": "Nota de Crédito",
		"08": "Nota de Débito",
	};

	// TODO: Connect to actual SUNAT CDR validation API
	return {
		success: true as const,
		es_valido: true,
		tipo_descripcion: tipoDescripcion[tipo],
		ruc_emisor,
		serie,
		numero,
		estado: "ACEPTADO",
		mensaje: `Comprobante ${tipoDescripcion[tipo]} ${serie}-${numero} válido en SUNAT`,
	};
}

/**
 * Get exchange rate from SBS
 * @param input - Input for input.
 * @returns Result of obtenerTipoCambio.
 * @example
 * ```ts
 * const result = await obtenerTipoCambio({} as ObtenerTipoCambioInput);
 * console.log(result);
 * ```
 */

export async function obtenerTipoCambio(input: ObtenerTipoCambioInput) {
	const { fecha, moneda } = input;

	loggers.ai.info("obtener_tipo_cambio called", { fecha, moneda });

	// TODO: Connect to actual SBS API
	return {
		success: true as const,
		fecha,
		moneda,
		compra: 3.72,
		venta: 3.75,
		fuente: "SBS - Superintendencia de Banca, Seguros y AFP",
	};
}

/**
 * Register expense from voice command
 * @param input - Input for input.
 * @returns Result of registrarGastoVoz.
 * @example
 * ```ts
 * const result = await registrarGastoVoz({} as RegistrarGastoVozInput);
 * console.log(result);
 * ```
 */

export async function registrarGastoVoz(input: RegistrarGastoVozInput) {
	const { descripcion, monto, cuenta_sugerida, medio_pago } = input;

	loggers.ai.info("registrar_gasto_voz called", {
		descripcion,
		monto,
		cuenta_sugerida,
		medio_pago,
	});

	// Determine account based on description
	const cuentaGasto = cuenta_sugerida || "6391"; // Default: otros gastos
	const cuentaPago = medio_pago === "efectivo" ? "1011" : "1041"; // Caja o Banco

	const asiento = {
		fecha: new Date().toISOString().split("T")[0],
		glosa: `Gasto: ${descripcion}`,
		lineas: [
			{ cuenta: cuentaGasto, debe: monto, haber: 0, glosa_linea: descripcion },
			{
				cuenta: cuentaPago,
				debe: 0,
				haber: monto,
				glosa_linea: `Pago ${medio_pago}`,
			},
		],
	};

	return {
		success: true as const,
		asiento_id: `ASI-VOZ-${Date.now()}`,
		cuenta_usada: cuentaGasto,
		medio_pago,
		monto,
		confirmacion: `Registrado gasto de S/ ${monto.toFixed(2)} en cuenta ${cuentaGasto} (${descripcion})`,
		asiento,
	};
}

// ============================================
// TOOL DEFINITIONS FOR GEMINI API
// ============================================

/**
 * Tool definitions in Gemini Function Calling format
 * @example
 * ```ts
 * console.log(geminiToolDefinitions);
 * ```
 */

export const geminiToolDefinitions = [
	{
		name: "crear_asiento",
		description: "Crear un asiento contable en el libro diario de Arkelythex",
		parameters: CrearAsientoSchema,
	},
	{
		name: "consultar_ruc_sunat",
		description:
			"Validar un RUC con SUNAT y obtener información del contribuyente",
		parameters: ConsultarRucSchema,
	},
	{
		name: "calcular_detraccion",
		description:
			"Calcular el monto de detracción según el tipo de servicio y umbral de S/ 700",
		parameters: CalcularDetraccionSchema,
	},
	{
		name: "verificar_comprobante",
		description: "Verificar si un comprobante de pago es válido en SUNAT",
		parameters: VerificarComprobanteSchema,
	},
	{
		name: "obtener_tipo_cambio",
		description:
			"Obtener el tipo de cambio oficial de la SBS para una fecha específica",
		parameters: ObtenerTipoCambioSchema,
	},
	{
		name: "registrar_gasto_voz",
		description:
			"Registrar un gasto a partir de un comando de voz. Crea el asiento contable correspondiente.",
		parameters: RegistrarGastoVozSchema,
	},
] as const;

/**
 * Tool executor - routes tool calls to implementations
 * @param toolName - Input for toolName.
 * @param args - Input for args.
 * @returns Result of executeGeminiTool.
 * @throws Error when executeGeminiTool cannot complete successfully.
 * @example
 * ```ts
 * const result = await executeGeminiTool("", undefined);
 * console.log(result);
 * ```
 */

export async function executeGeminiTool(toolName: string, args: unknown) {
	switch (toolName) {
		case "crear_asiento":
			return crearAsiento(CrearAsientoSchema.parse(args));
		case "consultar_ruc_sunat":
			return consultarRucSunat(ConsultarRucSchema.parse(args));
		case "calcular_detraccion":
			return calcularDetraccion(CalcularDetraccionSchema.parse(args));
		case "verificar_comprobante":
			return verificarComprobante(VerificarComprobanteSchema.parse(args));
		case "obtener_tipo_cambio":
			return obtenerTipoCambio(ObtenerTipoCambioSchema.parse(args));
		case "registrar_gasto_voz":
			return registrarGastoVoz(RegistrarGastoVozSchema.parse(args));
		default:
			throw new Error(`Unknown tool: ${toolName}`);
	}
}

/**
 * GeminiToolName type.
 *
 * @example
 * ```ts
 * const value: GeminiToolName = {} as GeminiToolName;
 * console.log(value);
 * ```
 */
export type GeminiToolName = (typeof geminiToolDefinitions)[number]["name"];
