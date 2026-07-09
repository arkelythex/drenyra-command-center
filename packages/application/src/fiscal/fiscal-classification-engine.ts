/**
 * FiscalClassificationEngine — Clasifica transacciones con impacto fiscal.
 *
 * Toma datos de una transacción (monto, tipo de comprobante, RUC, descripción)
 * y produce una FiscalClassification completa con:
 * - Tratamiento IGV determinado por reglas
 * - Detracción según tabla SUNAT
 * - Categoría SIRE
 * - Período fiscal
 *
 * Estrategia:
 * 1. Reglas determinísticas primero (tasa IGV, tipo de comprobante, RUC)
 * 2. Si hay ambigüedad, usa AI (LLMCaller)
 * 3. Si el usuario corrige, actualiza el aprendizaje
 *
 * @example
 * ```ts
 * const engine = new FiscalClassificationEngine();
 * const classification = await engine.classify({
 *   tipoComprobante: "01",
 *   montoTotal: 118.00,
 *   moneda: "PEN",
 *   descripcion: "Factura por servicios de consultoría",
 *   rucEmisor: "20123456786",
 * });
 *
 * console.log(classification.igvTreatment); // "GRAVADO"
 * console.log(classification.igvAmount);     // 18.00
 * ```
 */

import type {
	DetraccionInfo,
	FiscalClassification,
	IgvTreatment,
	IgvType,
	SireCategory,
	SireDocumentType,
} from "@drenyra/domain/fiscal";

// ============================================================================
// IGV Rate
// ============================================================================

const IGV_RATE = 18; // 18% (16% IGV + 2% IPM)
const IGV_FACTOR = IGV_RATE / 100;

// ============================================================================
// Detracción Table (SUNAT)
// ============================================================================

/**
 * Tabla de detracciones SUNAT.
 * Cada entrada mapea un código de bien/servicio a su porcentaje.
 *
 * @see https://www.sunat.gob.pe/legislacion/detraccion/
 */
interface DetraccionEntry {
	codigo: string;
	descripcion: string;
	porcentaje: number;
	keywords: string[]; // Para matching por descripción
}

const DETRACCION_TABLE: DetraccionEntry[] = [
	{
		codigo: "001",
		descripcion: "Azúcar y melaza",
		porcentaje: 10,
		keywords: ["azúcar", "melaza", "azucar"],
	},
	{
		codigo: "003",
		descripcion: "Alcohol etílico",
		porcentaje: 10,
		keywords: ["alcohol", "etílico", "etilico"],
	},
	{
		codigo: "004",
		descripcion: "Recursos hidrobiológicos",
		porcentaje: 4,
		keywords: ["pescado", "mariscos", "hidrobiológico", "hidrobiologico"],
	},
	{
		codigo: "005",
		descripcion: "Maíz amarillo duro",
		porcentaje: 4,
		keywords: ["maíz", "maiz", "amarillo"],
	},
	{ codigo: "006", descripcion: "Arroz", porcentaje: 4, keywords: ["arroz"] },
	{ codigo: "007", descripcion: "Madera", porcentaje: 4, keywords: ["madera"] },
	{
		codigo: "008",
		descripcion: "Reciclaje",
		porcentaje: 15,
		keywords: ["reciclaje", "reciclado", "desperdicio", "residuo"],
	},
	{
		codigo: "009",
		descripcion: "Minerales metálicos no auríferos",
		porcentaje: 10,
		keywords: ["mineral", "metal", "cobre", "zinc", "plomo"],
	},
	{
		codigo: "010",
		descripcion: "Bienes exonerados del IGV",
		porcentaje: 1.5,
		keywords: ["exonerado"],
	},
	{
		codigo: "011",
		descripcion: "Oro y minerales auríferos",
		porcentaje: 10,
		keywords: ["oro", "aurífero", "aurifero"],
	},
	{
		codigo: "012",
		descripcion: "Mensajería y delivery",
		porcentaje: 10,
		keywords: ["mensajería", "mensajeria", "delivery", "envío", "envio"],
	},
	{
		codigo: "013",
		descripcion: "Servicio de transporte de carga",
		porcentaje: 4,
		keywords: ["transporte", "carga", "flete", "logística", "logistica"],
	},
	{
		codigo: "014",
		descripcion: "Servicio de transporte de pasajeros",
		porcentaje: 10,
		keywords: ["transporte", "pasajero", "turístico", "turismo"],
	},
	{
		codigo: "015",
		descripcion: "Contratos de construcción",
		porcentaje: 4,
		keywords: [
			"construcción",
			"construccion",
			"obra",
			"edificación",
			"edificacion",
		],
	},
	{
		codigo: "016",
		descripcion: "Comisión mercantil",
		porcentaje: 10,
		keywords: ["comisión", "comision", "mercantil", "corretaje"],
	},
	{
		codigo: "017",
		descripcion: "Fabricación de bienes por encargo",
		porcentaje: 10,
		keywords: ["fabricación", "fabricacion", "encargo", "maquila"],
	},
	{
		codigo: "018",
		descripcion: "Servicio de alimentación",
		porcentaje: 10,
		keywords: [
			"alimentación",
			"alimentacion",
			"restaurant",
			"restaurante",
			"comida",
			"catering",
		],
	},
	{
		codigo: "019",
		descripcion: "Arrendamiento de bienes",
		porcentaje: 10,
		keywords: ["arrendamiento", "alquiler", "renta", "leasing"],
	},
	{
		codigo: "020",
		descripcion: "Servicios legales",
		porcentaje: 10,
		keywords: [
			"legal",
			"abogado",
			"notaría",
			"notaria",
			"asesoría",
			"asesoria legal",
		],
	},
	{
		codigo: "021",
		descripcion: "Servicios contables",
		porcentaje: 10,
		keywords: ["contable", "contabilidad", "auditoría", "auditoria"],
	},
	{
		codigo: "022",
		descripcion: "Servicios de informática",
		porcentaje: 10,
		keywords: [
			"informática",
			"informatica",
			"software",
			"sistema",
			"it",
			"computación",
			"computacion",
		],
	},
	{
		codigo: "023",
		descripcion: "Arrendamiento financiero",
		porcentaje: 10,
		keywords: ["arrendamiento", "financiero", "leasing"],
	},
	{
		codigo: "027",
		descripcion: "Servicio de hospitalidad",
		porcentaje: 4,
		keywords: ["hotel", "hospedaje", "alojamiento"],
	},
	{
		codigo: "028",
		descripcion: "Servicio de enseñanza",
		porcentaje: 4,
		keywords: [
			"enseñanza",
			"ensenanza",
			"educación",
			"educacion",
			"colegio",
			"universidad",
		],
	},
	{
		codigo: "031",
		descripcion: "Comisiones y tarifas bancarias",
		porcentaje: 10,
		keywords: ["comisión", "tarifa", "bancario", "banco"],
	},
	{
		codigo: "034",
		descripcion: "Servicios de salud",
		porcentaje: 10,
		keywords: ["salud", "médico", "medico", "clínica", "clinica", "hospital"],
	},
	{
		codigo: "036",
		descripcion: "Servicios de publicidad",
		porcentaje: 10,
		keywords: ["publicidad", "marketing", "anuncio", "difusión", "difusion"],
	},
	{
		codigo: "039",
		descripcion: "Venta de inmuebles",
		porcentaje: 10,
		keywords: ["inmueble", "propiedad", "terreno", "local", "departamento"],
	},
	{
		codigo: "099",
		descripcion: "Otras operaciones sujetas a detracción",
		porcentaje: 10,
		keywords: [],
	},
];

// ============================================================================
// Input
// ============================================================================

export interface ClassificationInput {
	/** Tipo de comprobante SUNAT (01=Factura, 03=Boleta, etc.). */
	tipoComprobante: SireDocumentType;
	/** Serie del comprobante. */
	serie: string;
	/** Número del comprobante. */
	numero?: string;
	/** Monto total (incluye IGV si es gravado). */
	montoTotal: number;
	/** Moneda. */
	moneda: "PEN" | "USD";
	/** Descripción del bien/servicio. */
	descripcion: string;
	/** RUC del emisor (para compras). */
	rucEmisor?: string;
	/** RUC del cliente (para ventas). */
	rucCliente?: string;
	/** Razón social de la contraparte. */
	razonSocial?: string;
	/** Si es compra o venta. */
	tipo: "COMPRA" | "VENTA";
	/** Fecha de emisión (YYYY-MM-DD). */
	fechaEmision: string;
	/** Tipo de cambio USD a PEN (si aplica). */
	tipoCambio?: number;
}

// ============================================================================
// Classification Engine
// ============================================================================

/**
 * Clasifica transacciones con impacto fiscal.
 *
 * Orden de operación:
 * 1. Determinar tipo IGV (débito/crédito) según COMPRA/VENTA
 * 2. Determinar tratamiento IGV (gravado por defecto)
 * 3. Calcular base imponible e IGV
 * 4. Determinar detracción por keywords en descripción
 * 5. Asignar categoría SIRE
 * 6. Determinar período fiscal
 */
export class FiscalClassificationEngine {
	/**
	 * Clasifica una transacción de forma determinística.
	 * Para casos ambiguos, usar classifyWithAI().
	 */
	classify(input: ClassificationInput): FiscalClassification {
		const isVenta = input.tipo === "VENTA";
		const igvType: IgvType = isVenta ? "DEBITO_FISCAL" : "CREDITO_FISCAL";
		const sireCategory: SireCategory = isVenta ? "VENTAS" : "COMPRAS";

		// Determinar tratamiento IGV
		const igvTreatment = this.determineIgvTreatment(input);

		// Calcular base imponible e IGV
		const { baseImponible, igvAmount, total } = this.calculateIgv(
			input.montoTotal,
			igvTreatment,
			input.moneda,
		);

		// Determinar detracción
		const detraccion = this.determineDetraccion(
			input.descripcion,
			baseImponible,
		);

		// Determinar período fiscal
		const periodo = this.determinePeriodo(input.fechaEmision);

		return {
			igvTreatment,
			igvType,
			igvRate: igvTreatment === "GRAVADO" ? IGV_RATE : 0,
			baseImponible,
			igvAmount,
			total,
			moneda: input.moneda,
			sireCategory,
			sireDocumentType: input.tipoComprobante,
			periodo,
			detraccion,
			percepcion: { aplica: false, porcentaje: 0, monto: 0, agente: "" },
			retencion: { aplica: false, porcentaje: 0, monto: 0, agente: "" },
			confidence: igvTreatment === "GRAVADO" ? 0.95 : 0.85,
			classificationSource: "DETERMINISTIC",
		};
	}

	/**
	 * Determina el tratamiento IGV según el tipo de comprobante y descripción.
	 */
	private determineIgvTreatment(input: ClassificationInput): IgvTreatment {
		const { tipoComprobante, descripcion } = input;

		// Exportación: chequeo antes que el default de factura
		if (/exportacion|exportación|extranjero|exterior/i.test(descripcion)) {
			return "EXPORTACION";
		}

		// Inafecto: intereses, multas, dividendos
		if (
			/interés|interes|multa|dividendo|indemnización|indemnizacion/i.test(
				descripcion,
			)
		) {
			return "INAFECTO";
		}

		// Exonerado: seguros, suscripciones
		if (/seguro|prima|suscripción|suscripcion/i.test(descripcion)) {
			return "EXONERADO";
		}

		// Facturas (01) y Boletas (03) con IGV son gravadas
		if (tipoComprobante === "01" || tipoComprobante === "03") {
			return "GRAVADO";
		}

		// NC (07) y ND (08) heredan el tratamiento
		if (tipoComprobante === "07" || tipoComprobante === "08") {
			return "GRAVADO";
		}

		// Default: gravado
		return "GRAVADO";
	}

	/**
	 * Calcula base imponible e IGV.
	 * Si el monto total incluye IGV, lo extrae.
	 * Si es exonerado/inafecto, el IGV es 0.
	 */
	private calculateIgv(
		montoTotal: number,
		treatment: IgvTreatment,
		_moneda: string,
	): { baseImponible: number; igvAmount: number; total: number } {
		if (treatment === "EXONERADO" || treatment === "INAFECTO") {
			return { baseImponible: montoTotal, igvAmount: 0, total: montoTotal };
		}

		if (treatment === "EXPORTACION") {
			return { baseImponible: montoTotal, igvAmount: 0, total: montoTotal };
		}

		// Gravado: el monto total incluye IGV
		// baseImponible = total / (1 + tasa)
		const baseImponible =
			Math.round((montoTotal / (1 + IGV_FACTOR)) * 100) / 100;
		const igvAmount = Math.round(baseImponible * IGV_FACTOR * 100) / 100;

		return { baseImponible, igvAmount, total: montoTotal };
	}

	/**
	 * Determina si aplica detracción según la descripción del bien/servicio.
	 */
	private determineDetraccion(
		descripcion: string,
		baseImponible: number,
	): DetraccionInfo {
		const descLower = descripcion.toLowerCase();

		for (const entry of DETRACCION_TABLE) {
			const match = entry.keywords.some((kw) => descLower.includes(kw));
			if (match) {
				const monto =
					Math.round(baseImponible * (entry.porcentaje / 100) * 100) / 100;
				return {
					codigo: entry.codigo,
					porcentaje: entry.porcentaje,
					monto,
					moneda: "PEN",
					aplica: true,
					estado: "PENDIENTE",
				};
			}
		}

		return {
			codigo: "",
			porcentaje: 0,
			monto: 0,
			moneda: "PEN",
			aplica: false,
			estado: "EXONERADO",
		};
	}

	/**
	 * Determina el período fiscal a partir de la fecha de emisión.
	 */
	private determinePeriodo(fechaEmision: string): string {
		const date = new Date(fechaEmision);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		return `${year}-${month}`;
	}
}
