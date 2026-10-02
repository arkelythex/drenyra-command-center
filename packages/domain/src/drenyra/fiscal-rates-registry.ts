/**
 * Fiscal Rates Registry — tasas fiscales versionadas con vigencia.
 *
 * Cada tasa tiene effectiveFrom/effectiveTo. Cuando SUNAT cambia una tasa,
 * se agrega una nueva entrada con nueva vigencia. Las reglas de verificación
 * consultan este registry por período, no literales hardcodeados.
 *
 * @since Jul 2026
 */

/**
 * Entrada de tasa fiscal versionada.
 */
export interface FiscalRateEntry {
	/** Código de la tasa (ej: "IGV", "DETRACCION_10", "DETRACCION_12") */
	rateId: string;
	/** Valor de la tasa en porcentaje (ej: 18 para 18%) */
	rate: number;
	/** Fecha ISO desde la que aplica */
	effectiveFrom: string;
	/** Fecha ISO hasta la que aplica (opcional: null = vigente) */
	effectiveTo: string | null;
	/** Referencia a la norma legal */
	normativeRef?: string;
	/** Descripción legible */
	description: string;
}

/**
 * Registry de tasas fiscales versionadas.
 * Se consulta por rateId + período para obtener la tasa aplicable.
 */
export const FISCAL_RATES: FiscalRateEntry[] = [
	// ── IGV ──
	{
		rateId: "IGV",
		rate: 18,
		effectiveFrom: "2011-03-01",
		effectiveTo: null,
		normativeRef: "Ley IGV DS 055-99-EF (tasa 18% desde 2011)",
		description: "Impuesto General a las Ventas — 18% (16% + 2% IPM)",
	},
	// ── Detracciones SPOT ──
	{
		rateId: "DETRACCION_10",
		rate: 10,
		effectiveFrom: "2024-01-01",
		effectiveTo: null,
		normativeRef: "Resolución SUNAT Nº 183-2023",
		description: "Detracción 10% — bienes y servicios generales",
	},
	{
		rateId: "DETRACCION_12",
		rate: 12,
		effectiveFrom: "2024-01-01",
		effectiveTo: null,
		normativeRef: "Resolución SUNAT Nº 183-2023",
		description: "Detracción 12% — servicios de transporte de carga",
	},
	{
		rateId: "ITF",
		rate: 0.005,
		effectiveFrom: "2024-01-01",
		effectiveTo: null,
		normativeRef: "Ley 29667",
		description: "Impuesto a las Transacciones Financieras — 0.005%",
	},
];

/**
 * Busca la tasa aplicable para un rateId en una fecha dada.
 * Retorna la entrada vigente más reciente (mayor effectiveFrom).
 */
export function getFiscalRate(
	rateId: string,
	asOf: string = new Date().toISOString(),
): FiscalRateEntry | null {
	const applicable = FISCAL_RATES.filter((entry) => {
		if (entry.rateId !== rateId) return false;
		if (entry.effectiveFrom > asOf) return false;
		if (entry.effectiveTo !== null && entry.effectiveTo < asOf) return false;
		return true;
	});

	if (applicable.length === 0) return null;

	// Ordenar por effectiveFrom descendente y tomar el más reciente
	applicable.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
	return applicable[0] ?? null;
}

/**
 * Retorna todas las entradas de un rateId (histórico completo).
 */
export function getFiscalRateHistory(rateId: string): FiscalRateEntry[] {
	return FISCAL_RATES.filter((entry) => entry.rateId === rateId).sort((a, b) =>
		a.effectiveFrom.localeCompare(b.effectiveFrom),
	);
}
