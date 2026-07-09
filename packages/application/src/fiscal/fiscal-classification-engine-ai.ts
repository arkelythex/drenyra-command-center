/**
 * FiscalClassificationEngineAI — clasificación fiscal con asistencia de LLM.
 *
 * Extiende el engine determinístico con un fallback a LLM cuando:
 * - La descripción no matchea ninguna keyword de detracción
 * - El tratamiento IGV es ambiguo (ni GRAVADO, EXONERADO, INAFECTO claro)
 * - La confianza determinística es < 0.7
 *
 * @example
 * ```ts
 * const engine = new FiscalClassificationEngine();
 * const aiEngine = new FiscalClassificationEngineAI(engine);
 *
 * // Si es ambiguo, llama al LLM
 * const result = await aiEngine.classifyWithAI(input, llmCaller);
 * ```
 */

import type { FiscalClassification } from "@drenyra/domain/fiscal";
import type { LLMCaller } from "@drenyra/fiscal-sdd";
import type {
	ClassificationInput,
	FiscalClassificationEngine,
} from "./fiscal-classification-engine";

// ============================================================================
// AI Prompt
// ============================================================================

const FISCAL_CLASSIFICATION_SYSTEM_PROMPT = `Eres un asistente de clasificación fiscal peruano.
Tu tarea es clasificar una transacción según la normativa SUNAT.
Responde SOLO con JSON válido, sin markdown ni explicaciones.`;

const FISCAL_CLASSIFICATION_USER_PROMPT = `Clasifica la siguiente transacción según normativa fiscal peruana:

## Datos de la transacción
- Tipo de comprobante: {tipoComprobante} ({tipoComprobanteLabel})
- Serie: {serie}
- Número: {numero}
- Monto total: {montoTotal} {moneda}
- Descripción: {descripcion}
- Tipo: {tipo} (COMPRA o VENTA)
- RUC emisor: {rucEmisor}
- RUC cliente: {rucCliente}
- Fecha emisión: {fechaEmision}

## Tarea
Determina:
1. Tratamiento IGV: GRAVADO | EXONERADO | INAFECTO | EXPORTACION | MIXTO
2. Tipo IGV: DEBITO_FISCAL (ventas) | CREDITO_FISCAL (compras)
3. Categoría SIRE: COMPRAS | VENTAS
4. Código de detracción (si aplica, según tabla SUNAT)
5. Porcentaje de detracción (si aplica)

## Formato de respuesta
{
  "igvTreatment": "GRAVADO",
  "detraccionCodigo": "020",
  "detraccionPorcentaje": 10,
  "detraccionAplica": true,
  "justificacion": "Servicios legales están sujetos a detracción 10% código 020"
}`;

// ============================================================================
// AI-Enhanced Classifier
// ============================================================================

/** Resultado de la clasificación con AI. */
export interface AiClassificationResult {
	classification: FiscalClassification;
	source: "DETERMINISTIC" | "AI" | "DETERMINISTIC_AI";
	aiJustification?: string;
	aiRawResponse?: string;
}

/**
 * Clasificador que usa reglas determinísticas + fallback a LLM.
 */
export class FiscalClassificationEngineAI {
	constructor(private engine: FiscalClassificationEngine) {}

	/**
	 * Clasifica una transacción. Si la confianza determinística es >= 0.7,
	 * usa el resultado directo. Si es menor, consulta al LLM.
	 */
	async classify(
		input: ClassificationInput,
		caller?: LLMCaller,
	): Promise<AiClassificationResult> {
		// Primero: clasificación determinística
		const deterministic = this.engine.classify(input);

		// Si la confianza es suficiente y no hay ambigüedad, usarla
		if (deterministic.confidence >= 0.7 && !this.isAmbiguous(input)) {
			return {
				classification: deterministic,
				source: "DETERMINISTIC",
			};
		}

		// Si no hay LLM caller, devolver la determinística con advertencia
		if (!caller) {
			return {
				classification: {
					...deterministic,
					confidence: Math.min(deterministic.confidence, 0.5),
				},
				source: "DETERMINISTIC",
			};
		}

		// Consultar al LLM
		try {
			return await this.classifyWithLLM(input, deterministic, caller);
		} catch {
			// Fallback a determinístico si el LLM falla
			return {
				classification: {
					...deterministic,
					confidence: Math.min(deterministic.confidence, 0.4),
				},
				source: "DETERMINISTIC",
			};
		}
	}

	/**
	 * Determina si una transacción es ambigua para el engine determinístico.
	 */
	private isAmbiguous(input: ClassificationInput): boolean {
		// Descripción muy corta o genérica
		if (input.descripcion.length < 10) return true;

		// Palabras genéricas que no dan contexto fiscal
		const genericWords = [
			"servicio",
			"producto",
			"venta",
			"compra",
			"honorario",
			"comisión",
			"comision",
			"gasto",
		];
		const descLower = input.descripcion.toLowerCase();
		const hasOnlyGeneric =
			genericWords.some((w) => descLower.includes(w)) &&
			!/detraccion|construcción|transporte|legal|contable|informática|salud|educación/i.test(
				descLower,
			);

		if (hasOnlyGeneric) return true;

		return false;
	}

	/**
	 * Clasifica usando LLM.
	 */
	private async classifyWithLLM(
		input: ClassificationInput,
		fallback: FiscalClassification,
		caller: LLMCaller,
	): Promise<AiClassificationResult> {
		const tipoLabel =
			input.tipoComprobante === "01"
				? "Factura"
				: input.tipoComprobante === "03"
					? "Boleta"
					: input.tipoComprobante === "07"
						? "Nota de Crédito"
						: input.tipoComprobante === "08"
							? "Nota de Débito"
							: input.tipoComprobante;

		const userPrompt = FISCAL_CLASSIFICATION_USER_PROMPT.replace(
			"{tipoComprobante}",
			input.tipoComprobante,
		)
			.replace("{tipoComprobanteLabel}", tipoLabel)
			.replace("{serie}", input.serie)
			.replace("{numero}", input.numero ?? "-")
			.replace("{montoTotal}", String(input.montoTotal))
			.replace("{moneda}", input.moneda)
			.replace("{descripcion}", input.descripcion)
			.replace("{tipo}", input.tipo)
			.replace("{rucEmisor}", input.rucEmisor ?? "-")
			.replace("{rucCliente}", input.rucCliente ?? "-")
			.replace("{fechaEmision}", input.fechaEmision);

		const response = await caller(
			FISCAL_CLASSIFICATION_SYSTEM_PROMPT,
			userPrompt,
		);

		// Parsear respuesta
		let aiResult: Record<string, unknown>;
		try {
			const cleaned = response
				.replace(/^```(?:json)?\s*/i, "")
				.replace(/\s*```$/i, "")
				.trim();
			aiResult = JSON.parse(cleaned);
		} catch {
			return {
				classification: fallback,
				source: "DETERMINISTIC",
				aiRawResponse: response,
			};
		}

		// Fusionar con resultado determinístico
		const merged: FiscalClassification = {
			...fallback,
			igvTreatment:
				(aiResult.igvTreatment as FiscalClassification["igvTreatment"]) ??
				fallback.igvTreatment,
			confidence: 0.85,
			classificationSource: "AI",
		};

		// Si el AI detectó detracción, actualizar
		if (aiResult.detraccionAplica === true) {
			const codigo = String(aiResult.detraccionCodigo ?? "");
			const porcentaje = Number(aiResult.detraccionPorcentaje) || 0;
			merged.detraccion = {
				...merged.detraccion,
				aplica: true,
				codigo,
				porcentaje,
				monto:
					Math.round(merged.baseImponible * (porcentaje / 100) * 100) / 100,
				estado: "PENDIENTE",
			};
		}

		return {
			classification: merged,
			source: "DETERMINISTIC_AI",
			aiJustification: String(aiResult.justificacion ?? ""),
			aiRawResponse: response,
		};
	}
}
