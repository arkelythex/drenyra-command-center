/**
 * GetInboxConversationQuery — Returns a deterministic contextual answer for inbox queries.
 *
 * Extracted from inline route handler for CQRS compliance.
 *
 * @module inbox/application/queries
 */

export interface GetConversationInput {
	question: string;
}

export interface GetConversationResult {
	question: string;
	answer: string;
}

/**
 * Returns a contextual inbox conversation answer (deterministic MVP).
 *
 * @param input - The user's question
 * @returns The conversation result with question and answer
 *
 * @example
 * ```ts
 * const result = await getConversation({ question: '¿cuánto IGV?' });
 * ```
 */
export async function getConversation(
	input: GetConversationInput,
): Promise<GetConversationResult> {
	const { question } = input;
	const normalized = question.toLowerCase();
	let answer =
		"Preguntame sobre el batch actual: errores, revisión, IGV o declaración.";

	if (normalized.includes("error")) {
		answer =
			"Las facturas con error aparecen marcadas en rojo en el detalle del batch.";
	} else if (
		normalized.includes("revisión") ||
		normalized.includes("revision")
	) {
		answer =
			"Las facturas en revisión tienen discrepancias SUNAT (RUC o IGV) — abrí el detalle para ver el motivo.";
	} else if (normalized.includes("igv")) {
		answer =
			"El IGV se suma del batch procesado; revisá cada factura lista para el monto exacto.";
	} else if (normalized.includes("declar")) {
		answer =
			"Mock MVP: las facturas listas pueden derivarse a declaración desde el botón Ir a declarar.";
	}

	return { question, answer };
}
