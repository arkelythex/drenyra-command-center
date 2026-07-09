/**
 * Fiscal General Ledger (FGL) — Core Types
 *
 * El FGL es una capa de clasificación fiscal sobre el ledger contable.
 * Cada transacción financiera se etiqueta automáticamente con:
 * - Tratamiento IGV (gravado, exonerado, inafecto, exportación)
 * - Tasa y monto IGV
 * - Detracción aplicable (porcentaje y monto según tabla SUNAT)
 * - Percepción/Retención (si aplica)
 * - Categoría SIRE (compras/ventas)
 * - Período fiscal
 * - RUC
 *
 * @since Jul 2026
 */

// ============================================================================
// IGV Treatment
// ============================================================================

/**
 * Tratamiento IGV de una transacción.
 * Determina cómo se calcula y declara el IGV.
 */
export type IgvTreatment =
	/** Gravado: operación sujeta a IGV (la mayoría). IGV = base * tasa */
	| "GRAVADO"
	/** Exonerado: operación exenta pero con derecho a crédito fiscal */
	| "EXONERADO"
	/** Inafecto: operación no sujeta a IGV (ej: intereses bancarios) */
	| "INAFECTO"
	/** Exportación: tasa 0% con devolución de IGV */
	| "EXPORTACION"
	/** Mixto: parcialmente gravado (ej: servicios que incluyen componentes no gravados) */
	| "MIXTO";

export const IGV_TREATMENT_LABELS: Record<IgvTreatment, string> = {
	GRAVADO: "Gravado — operación sujeta a IGV",
	EXONERADO: "Exonerado — exento con derecho a crédito fiscal",
	INAFECTO: "Inafecto — no sujeto a IGV",
	EXPORTACION: "Exportación — tasa 0% con devolución",
	MIXTO: "Mixto — parcialmente gravado",
};

/**
 * Tipo de IGV (débito o crédito fiscal).
 */
export type IgvType = "DEBITO_FISCAL" | "CREDITO_FISCAL";

// ============================================================================
// Detracción / Percepción / Retención
// ============================================================================

/**
 * Detracción SPOT aplicable a una transacción.
 */
export interface DetraccionInfo {
	/** Código de bien/servicio según tabla SUNAT. */
	codigo: string;
	/** Porcentaje de detracción (ej: 10 para 10%). */
	porcentaje: number;
	/** Monto de la detracción. */
	monto: number;
	/** Moneda. */
	moneda: "PEN" | "USD";
	/** Si está sujeta a detracción. */
	aplica: boolean;
	/** Si se pagó o está pendiente. */
	estado: "PENDIENTE" | "PAGADO" | "EXONERADO";
	/** Fecha límite de depósito. */
	fechaLimite?: string;
}

/**
 * Percepción aplicable.
 */
export interface PercepcionInfo {
	/** Porcentaje de percepción. */
	porcentaje: number;
	/** Monto percibido. */
	monto: number;
	/** Agente de percepción. */
	agente: string;
	aplica: boolean;
}

/**
 * Retención aplicable.
 */
export interface RetencionInfo {
	/** Porcentaje de retención. */
	porcentaje: number;
	/** Monto retenido. */
	monto: number;
	/** Agente de retención. */
	agente: string;
	aplica: boolean;
}

// ============================================================================
// SIRE Category
// ============================================================================

/**
 * Categoría SIRE para la transacción.
 */
export type SireCategory = "COMPRAS" | "VENTAS";

export type SireDocumentType =
	| "01" // Factura
	| "03" // Boleta
	| "07" // Nota de Crédito
	| "08" // Nota de Débito
	| "20" // DUA
	| "50" // Declaración Única de Importación
	| string;

// ============================================================================
// FiscalClassification — Resultado de clasificar una transacción
// ============================================================================

/**
 * Clasificación fiscal completa de una transacción.
 * Este es el OUTPUT del FiscalClassificationEngine.
 */
export interface FiscalClassification {
	/** Tratamiento IGV. */
	igvTreatment: IgvTreatment;
	/** Tipo IGV (débito/crédito). */
	igvType: IgvType;
	/** Tasa IGV aplicada (ej: 18.0 para 18%). */
	igvRate: number;
	/** Base imponible (monto antes de IGV). */
	baseImponible: number;
	/** Monto IGV calculado. */
	igvAmount: number;
	/** Monto total (base + IGV). */
	total: number;
	/** Moneda. */
	moneda: "PEN" | "USD";
	/** Categoría SIRE. */
	sireCategory: SireCategory;
	/** Tipo de comprobante SIRE. */
	sireDocumentType: SireDocumentType;
	/** Período fiscal (YYYY-MM). */
	periodo: string;
	/** Detracción (si aplica). */
	detraccion: DetraccionInfo;
	/** Percepción (si aplica). */
	percepcion: PercepcionInfo;
	/** Retención (si aplica). */
	retencion: RetencionInfo;
	/** Confianza de la clasificación (0-1). */
	confidence: number;
	/** Si fue clasificado por reglas determinísticas o AI. */
	classificationSource: "DETERMINISTIC" | "AI" | "HUMAN";
}

// ============================================================================
// FiscalTransaction — Transacción con clasificación fiscal
// ============================================================================

/**
 * Transacción fiscalmente clasificada.
 * Este es el tipo base del Fiscal General Ledger.
 */
export interface FiscalTransaction {
	/** ID único de la transacción. */
	id: string;
	/** RUC de la compañía. */
	companyRuc: string;
	/** ID de la compañía en el sistema. */
	companyId: string;
	/** Fecha de emisión del comprobante. */
	fechaEmision: string;
	/** Fecha de contabilización (cuando se registra). */
	fechaContable: string;
	/** Tipo de comprobante. */
	tipoComprobante: SireDocumentType;
	/** Serie del comprobante. */
	serie: string;
	/** Número del comprobante. */
	numero: string;
	/** RUC del emisor (si es compra) o cliente (si es venta). */
	rucContraparte: string;
	/** Razón social de la contraparte. */
	razonSocialContraparte: string;
	/** Moneda original. */
	moneda: "PEN" | "USD";
	/** Tipo de cambio (si es USD). */
	tipoCambio?: number;
	/** Monto total en moneda original. */
	montoOriginal: number;
	/** Monto total en PEN. */
	montoPEN: number;
	/** Clasificación fiscal. */
	classification: FiscalClassification;
	/** Categoría contable (opcional, para integración con plan de cuentas). */
	categoriaContable?: string;
	/** Metadatos adicionales. */
	metadata: Record<string, unknown>;
	/** Hash de la transacción para integridad. */
	hash: string;
	/** Cuándo se registró. */
	createdAt: string;
	/** Quién/quién clasificó (system, agentId, userId). */
	classifiedBy: string;
}

// ============================================================================
// FiscalPeriodSummary — Resumen fiscal por período
// ============================================================================

/**
 * Resumen fiscal de un período.
 */
export interface FiscalPeriodSummary {
	/** Período (YYYY-MM). */
	periodo: string;
	/** RUC. */
	companyRuc: string;
	/** Total ventas gravadas. */
	ventasGravadas: number;
	/** Total ventas exoneradas. */
	ventasExoneradas: number;
	/** Total ventas inafectas. */
	ventasInafectas: number;
	/** Total IGV ventas (débito fiscal). */
	igvVentas: number;
	/** Total compras gravadas. */
	comprasGravadas: number;
	/** Total IGV compras (crédito fiscal). */
	igvCompras: number;
	/** IGV a pagar (débito - crédito, si positivo). */
	igvAPagar: number;
	/** IGV a favor (crédito - débito, si positivo). */
	igvAFavor: number;
	/** Total detracciones del período. */
	totalDetracciones: number;
	/** Detracciones pendientes. */
	detraccionesPendientes: number;
	/** Total percepciones. */
	totalPercepciones: number;
	/** Total retenciones. */
	totalRetenciones: number;
	/** Número de transacciones clasificadas. */
	transactionCount: number;
	/** Número de transacciones con baja confianza (requieren revisión). */
	pendingReview: number;
	/** Fecha del resumen. */
	generatedAt: string;
}

// ============================================================================
// FiscalHealthScore
// ============================================================================

/**
 * Score de salud fiscal de una empresa.
 * 0-100, donde 100 es fiscalmente impecable.
 */
export interface FiscalHealthScore {
	companyRuc: string;
	periodo: string;
	/** Score general (0-100). */
	overall: number;
	/** Breakdown por componente. */
	components: {
		/** Reproducibilidad SIRE vs ledger (0-40). */
		sireReproducibility: number;
		/** Anomalías detectadas (0-30). */
		anomaliesScore: number;
		/** Puntualidad en declaraciones (0-20). */
		timeliness: number;
		/** Cumplimiento normativo (0-10). */
		compliance: number;
	};
	/** Alertas activas. */
	alerts: Array<{
		severity: "CRITICAL" | "WARNING" | "INFO";
		message: string;
		affectedArea: string;
	}>;
	generatedAt: string;
}
