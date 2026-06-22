/**
 * PDT 621 — IGV-Renta Mensual
 *
 * Generates the data structure for PDT Form 621 (monthly VAT and income tax declaration).
 * This is the machine-readable format for SUNAT's PDT software upload.
 *
 * Key casillas (fields):
 *   100: Base imponible ventas gravadas
 *   105: IGV de ventas gravadas
 *   107: Percepciones añadidas al impuesto
 *   120: Base imponible compras gravadas
 *   125: IGV de compras (crédito fiscal)
 *   169: Retención de terceros
 *   185: Tributo resultante (casilla 105 - 125 - 107 - 169)
 *
 * @see https://www.sunat.gob.pe/orientacion/mypes/pdt621.html
 */

import { z } from "zod";

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** IGV vigente SUNAT 2026 */
const IGV_RATE = 0.18;
/** Tolerancia en soles para diferencias de redondeo en IGV */
const IGV_TOLERANCE_PEN = 2;

/**
 * Pdt621InputSchema const.
 *
 * @example
 * ```ts
 * console.log(Pdt621InputSchema);
 * ```
 */
export const Pdt621InputSchema = z.object({
	ruc: z.string().length(11),
	period: z.string().regex(PERIOD_REGEX, "Formato YYYY-MM"),
	razonSocial: z.string().min(1),
	// Ventas
	ventasGravadasBase: z.number().nonnegative(), // Casilla 100
	ventasGravadasIgv: z.number().nonnegative(), // Casilla 105
	percepciones: z.number().nonnegative().default(0), // Casilla 107
	// Compras
	comprasGravadasBase: z.number().nonnegative(), // Casilla 120
	comprasGravadasIgv: z.number().nonnegative(), // Casilla 125
	retenciones: z.number().nonnegative().default(0), // Casilla 169
	// Opcionales
	exportaciones: z.number().nonnegative().default(0),
	operacionesNoGravadas: z.number().nonnegative().default(0),
});

/**
 * Pdt621Input type.
 *
 * @example
 * ```ts
 * const value: Pdt621Input = {} as Pdt621Input;
 * console.log(value);
 * ```
 */
export type Pdt621Input = z.infer<typeof Pdt621InputSchema>;

/**
 * Pdt621Casillas interface.
 *
 * @example
 * ```ts
 * const value: Pdt621Casillas = {} as Pdt621Casillas;
 * console.log(value);
 * ```
 */
export interface Pdt621Casillas {
	"100": number; // Base ventas gravadas
	"105": number; // IGV ventas
	"107": number; // Percepciones
	"120": number; // Base compras
	"125": number; // Crédito fiscal IGV
	"169": number; // Retenciones
	"185": number; // Tributo resultante = casilla 105 - 125 - 107 - 169
}

/**
 * Pdt621Result interface.
 *
 * @example
 * ```ts
 * const value: Pdt621Result = {} as Pdt621Result;
 * console.log(value);
 * ```
 */
export interface Pdt621Result {
	ruc: string;
	period: string;
	razonSocial: string;
	casillas: Pdt621Casillas;
	igvResultante: number; // Positivo = a pagar, negativo = saldo a favor
	status: "a_pagar" | "saldo_a_favor" | "equilibrado";
	generatedAt: string;
	warnings: string[];
}

function validateIgvConsistency(
	base: number,
	declared: number,
	label: "ventas" | "compras",
	warnings: string[],
): void {
	const expected = Number((base * IGV_RATE).toFixed(2));
	if (Math.abs(declared - expected) > IGV_TOLERANCE_PEN) {
		warnings.push(
			`IGV ${label} (S/ ${declared}) difiere del calculado 18% (S/ ${expected}). ` +
				`Verificar ${label === "ventas" ? "operaciones exoneradas o diferencias de tipo de cambio" : "crédito fiscal aplicable"}.`,
		);
	}
}

function resolveStatus(igvResultante: number): Pdt621Result["status"] {
	if (igvResultante > 0.5) return "a_pagar";
	if (igvResultante < -0.5) return "saldo_a_favor";
	return "equilibrado";
}

/**
 * Calculate PDT 621 casillas from period data.
 * All amounts in PEN (soles), 2 decimal places.
 * @param input - Input for input.
 * @returns Result of buildPdt621.
 * @example
 * ```ts
 * const result = buildPdt621({} as Pdt621Input);
 * console.log(result);
 * ```
 */

export function buildPdt621(input: Pdt621Input): Pdt621Result {
	const parsed = Pdt621InputSchema.parse(input);
	const warnings: string[] = [];

	validateIgvConsistency(
		parsed.ventasGravadasBase,
		parsed.ventasGravadasIgv,
		"ventas",
		warnings,
	);
	validateIgvConsistency(
		parsed.comprasGravadasBase,
		parsed.comprasGravadasIgv,
		"compras",
		warnings,
	);

	// Casilla 185: IGV resultante
	// = IGV ventas - crédito fiscal - percepciones - retenciones
	const igvResultante = Number(
		(
			parsed.ventasGravadasIgv -
			parsed.comprasGravadasIgv -
			parsed.percepciones -
			parsed.retenciones
		).toFixed(2),
	);

	return {
		ruc: parsed.ruc,
		period: parsed.period,
		razonSocial: parsed.razonSocial,
		casillas: {
			"100": parsed.ventasGravadasBase,
			"105": parsed.ventasGravadasIgv,
			"107": parsed.percepciones,
			"120": parsed.comprasGravadasBase,
			"125": parsed.comprasGravadasIgv,
			"169": parsed.retenciones,
			"185": igvResultante,
		},
		igvResultante,
		status: resolveStatus(igvResultante),
		generatedAt: new Date().toISOString(),
		warnings,
	};
}
