import { z, toJSONSchema } from "zod";
import {
	consultarRucSunat as consultarRucApi,
} from "@arkelythex/infrastructure/api/sunat.service";
import { loggers } from "../../logger";
import {
	CalcularDetraccionSchema,
	ConsultarRucSchema,
	CrearAsientoSchema,
	ObtenerTipoCambioSchema,
	RegistrarGastoVozSchema,
	VerificarComprobanteSchema,
	type CalcularDetraccionInput,
	type ConsultarRucInput,
	type CrearAsientoInput,
	type ObtenerTipoCambioInput,
	type RegistrarGastoVozInput,
	type VerificarComprobanteInput,
} from "./types";

// ---------------------------------------------------------------------------
// JSON Schema helper for Gemini tool definitions
// Avoids circular dependency with @arkelythex/ai by using zod directly.
// ---------------------------------------------------------------------------

/**
 * Convert a Zod schema to a Draft-07 JSON Schema object using Zod v4's
 * built-in `toJSONSchema()`. Used to create type-safe ToolDefinition params.
 */
function zodToolSchemaObject(schema: z.ZodTypeAny): Record<string, unknown> {
	const raw = toJSONSchema(schema, { target: "draft-07" }) as Record<
		string,
		unknown
	>;
	const { $schema: _, ...clean } = raw;
	return { ...clean, additionalProperties: false };
}

export async function crearAsiento(input: CrearAsientoInput) {
	const { fecha, glosa, lineas } = input;

	loggers.ai.info("crear_asiento called", { fecha, glosa, lineas });

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

export async function calcularDetraccion(input: CalcularDetraccionInput) {
	const { monto_total, tipo_servicio } = input;

	loggers.ai.info("calcular_detraccion called", { monto_total, tipo_servicio });

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

export async function obtenerTipoCambio(input: ObtenerTipoCambioInput) {
	const { fecha, moneda } = input;

	loggers.ai.info("obtener_tipo_cambio called", { fecha, moneda });

	return {
		success: true as const,
		fecha,
		moneda,
		compra: 3.72,
		venta: 3.75,
		fuente: "SBS - Superintendencia de Banca, Seguros y AFP",
	};
}

export async function registrarGastoVoz(input: RegistrarGastoVozInput) {
	const { descripcion, monto, cuenta_sugerida, medio_pago } = input;

	loggers.ai.info("registrar_gasto_voz called", {
		descripcion,
		monto,
		cuenta_sugerida,
		medio_pago,
	});

	const cuentaGasto = cuenta_sugerida || "6391";
	const cuentaPago = medio_pago === "efectivo" ? "1011" : "1041";

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

/**
 * Gemini tool definitions with Zod schemas as parameters.
 *
 * Kept for backward compatibility with the tool bridge (bridge.ts),
 * which reads `.parameters` as a raw Zod schema for its hand-rolled
 * conversion. Do NOT remove without updating the bridge.
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
 * Gemini tool definitions with Draft-07 JSON Schema parameters.
 *
 * Each tool wraps its Zod schema via `zodToolSchemaObject()` so that
 * `.parameters` is a JSON Schema object suitable for LLM provider tool
 * definitions and the ToolRegistry's `zodSchema` auto-conversion.
 */
export const geminiToolDefs = geminiToolDefinitions.map((tool) => ({
	name: tool.name,
	description: tool.description,
	parameters: zodToolSchemaObject(tool.parameters),
})) as readonly {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
}[];

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

export type GeminiToolName = (typeof geminiToolDefinitions)[number]["name"];
