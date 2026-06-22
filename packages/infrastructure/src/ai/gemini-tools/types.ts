import { z } from "zod";

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

export type CrearAsientoInput = z.infer<typeof CrearAsientoSchema>;
export type ConsultarRucInput = z.infer<typeof ConsultarRucSchema>;
export type CalcularDetraccionInput = z.infer<typeof CalcularDetraccionSchema>;
export type VerificarComprobanteInput = z.infer<typeof VerificarComprobanteSchema>;
export type ObtenerTipoCambioInput = z.infer<typeof ObtenerTipoCambioSchema>;
export type RegistrarGastoVozInput = z.infer<typeof RegistrarGastoVozSchema>;
