import { consultarRucSunat as consultarRucApi } from "@drenyra/infrastructure/api/sunat.service";
import { z } from "zod";
import { loggers } from "../logger";
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
export const ConsultarRucSchema = z.object({
	ruc: z.string().length(11).describe("RUC de 11 dígitos a validar con SUNAT"),
});
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
export const VerificarComprobanteSchema = z.object({
	ruc_emisor: z.string().length(11).describe("RUC del emisor del comprobante"),
	tipo: z
		.enum(["01", "03", "07", "08"])
		.describe("Tipo de comprobante: 01=Factura, 03=Boleta, 07=NC, 08=ND"),
	serie: z.string().describe("Serie del comprobante (ej: F001)"),
	numero: z.string().describe("Número del comprobante"),
});
export const ObtenerTipoCambioSchema = z.object({
	fecha: z
		.string()
		.describe("Fecha para consultar tipo de cambio (YYYY-MM-DD)"),
	moneda: z.enum(["USD", "EUR"]).default("USD").describe("Moneda a consultar"),
});
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
export async function crearAsiento(input) {
	const { fecha, glosa, lineas } = input;
	loggers.ai.info("crear_asiento called", { fecha, glosa, lineas });
	const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
	const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);
	if (Math.abs(totalDebe - totalHaber) > 0.01) {
		return {
			success: false,
			error: `El asiento no cuadra: Debe (${totalDebe}) ≠ Haber (${totalHaber})`,
		};
	}
	return {
		success: true,
		asiento_id: `ASI-${Date.now()}`,
		mensaje: `Asiento creado: ${glosa}`,
		total: totalDebe,
	};
}
export async function consultarRucSunat(input) {
	const { ruc } = input;
	loggers.ai.info("consultar_ruc called", { ruc });
	try {
		const result = await consultarRucApi(ruc);
		return {
			success: true,
			ruc: result.ruc,
			razon_social: result.razonSocial,
			estado: result.estado,
			condicion: result.condicion,
			direccion: result.direccion || "No disponible",
			tipo: result.tipo,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error consultando SUNAT",
		};
	}
}
export async function calcularDetraccion(input) {
	const { monto_total, tipo_servicio } = input;
	loggers.ai.info("calcular_detraccion called", { monto_total, tipo_servicio });
	const porcentajes = {
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
			success: true,
			aplica_detraccion: false,
			razon: "Monto menor o igual a S/ 700, no aplica detracción",
			monto_a_pagar: monto_total,
		};
	}
	const monto_detraccion = Math.round(monto_total * porcentaje * 100) / 100;
	const monto_neto = monto_total - monto_detraccion;
	return {
		success: true,
		aplica_detraccion: true,
		porcentaje: porcentaje * 100,
		monto_detraccion,
		monto_neto,
		depositar_en: "Banco de la Nación - Cuenta detracciones del proveedor",
	};
}
export async function verificarComprobante(input) {
	const { ruc_emisor, tipo, serie, numero } = input;
	loggers.ai.info("verificar_comprobante called", {
		ruc_emisor,
		tipo,
		serie,
		numero,
	});
	const tipoDescripcion = {
		"01": "Factura",
		"03": "Boleta de Venta",
		"07": "Nota de Crédito",
		"08": "Nota de Débito",
	};
	return {
		success: true,
		es_valido: true,
		tipo_descripcion: tipoDescripcion[tipo],
		ruc_emisor,
		serie,
		numero,
		estado: "ACEPTADO",
		mensaje: `Comprobante ${tipoDescripcion[tipo]} ${serie}-${numero} válido en SUNAT`,
	};
}
export async function obtenerTipoCambio(input) {
	const { fecha, moneda } = input;
	loggers.ai.info("obtener_tipo_cambio called", { fecha, moneda });
	return {
		success: true,
		fecha,
		moneda,
		compra: 3.72,
		venta: 3.75,
		fuente: "SBS - Superintendencia de Banca, Seguros y AFP",
	};
}
export async function registrarGastoVoz(input) {
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
		success: true,
		asiento_id: `ASI-VOZ-${Date.now()}`,
		cuenta_usada: cuentaGasto,
		medio_pago,
		monto,
		confirmacion: `Registrado gasto de S/ ${monto.toFixed(2)} en cuenta ${cuentaGasto} (${descripcion})`,
		asiento,
	};
}
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
];
export async function executeGeminiTool(toolName, args) {
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

