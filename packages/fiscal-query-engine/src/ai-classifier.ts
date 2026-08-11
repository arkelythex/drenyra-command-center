/**
 * AI Classifier Fallback
 *
 * Cuando pattern matching no alcanza confianza suficiente,
 * usa el LLM Gateway para clasificar la consulta.
 *
 * El LLM Gateway corre en apps/api como POST /api/v1/chat/completions
 * y soporta múltiples providers (OpenAI, DeepSeek, Anthropic, etc.).
 */

import type { IntentClassification, IntentKind } from "./types";

const LLM_API_URL = "http://localhost:3000/api/v1/chat/completions";

const SYSTEM_PROMPT = `Eres un clasificador de consultas fiscales peruanas.
Debes identificar la intención del usuario y extraer entidades.

INTENCIONES POSIBLES:
- igv-consulta: El usuario pregunta sobre IGV (Impuesto General a las Ventas)
- detracciones-consulta: El usuario pregunta sobre detracciones/SPOT
- sire-resumen: El usuario pide un resumen SIRE
- retenciones-consulta: El usuario pregunta sobre retenciones
- pipeline-run: El usuario quiere ejecutar un pipeline/análisis completo
- factura-lookup: El usuario busca una factura o comprobante específico
- unknown: No se puede determinar la intención

Responde SOLO con JSON:
{
  "kind": "igv-consulta",
  "confidence": 0.95,
  "ruc": "20123456789" | null,
  "periodo": "2026-07" | null,
  "keywords": ["igv", "julio"]
}`;

interface LLMResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

interface LLMClassification {
	kind: IntentKind;
	confidence: number;
	ruc: string | null;
	periodo: string | null;
	keywords: string[];
}

/**
 * Clasifica una consulta usando el LLM Gateway.
 * Retorna null si el gateway no está disponible.
 */
export async function classifyWithAI(
	texto: string,
): Promise<IntentClassification | null> {
	try {
		const res = await fetch(LLM_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(10000), // 10s timeout
			body: JSON.stringify({
				model: "deepseek/deepseek-chat",
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{
						role: "user",
						content: `Clasificá esta consulta fiscal: "${texto}"`,
					},
				],
				temperature: 0.1,
				max_tokens: 200,
			}),
		});

		if (!res.ok) {
			console.warn(`[AI Classifier] LLM Gateway returned ${res.status}`);
			return null;
		}

		const data: LLMResponse = await res.json();
		const content = data.choices?.[0]?.message?.content;
		if (!content) return null;

		// Extract JSON from response (handle markdown-wrapped JSON)
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) return null;

		const parsed: LLMClassification = JSON.parse(jsonMatch[0]);

		return {
			kind: parsed.kind ?? "unknown",
			confidence: parsed.confidence ?? 0.5,
			extracted: {
				...(parsed.ruc != null ? { ruc: parsed.ruc } : {}),
				...(parsed.periodo != null ? { periodo: parsed.periodo } : {}),
				keywords: parsed.keywords ?? [],
			},
		};
	} catch (err) {
		console.warn(
			"[AI Classifier] Fallback failed:",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}
