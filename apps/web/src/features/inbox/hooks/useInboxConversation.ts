import { useCallback, useMemo, useState } from "react";
import { n } from "@/lib/utils";
import type { BatchCompleteEvent } from "../inbox.schema";

export interface InboxConversationMessage {
	id: string;
	role: "user" | "assistant";
	text: string;
}

/**
 * Local contextual Q&A over the current batch (no LLM — spec MVP).
 */
export function useInboxConversation(batch: BatchCompleteEvent | null) {
	const [messages, setMessages] = useState<InboxConversationMessage[]>([]);

	const answerLocally = useCallback(
		(question: string): string => {
			const q = question.toLowerCase().trim();
			if (!batch) {
				return "Subí facturas primero; después te respondo sobre el batch.";
			}

			if (q.includes("error") || q.includes("fall")) {
				const errors = batch.invoices.filter((item) => item.status === "error");
				if (errors.length === 0)
					return "No hay facturas con error en este batch.";
				return errors
					.map((item) => `${item.filename}: ${item.error ?? "error"}`)
					.join("\n");
			}

			if (
				q.includes("revisión") ||
				q.includes("revision") ||
				q.includes("revisar")
			) {
				const review = batch.invoices.filter(
					(item) => item.status === "needs-review",
				);
				if (review.length === 0) return "Nada pendiente de revisión.";
				return review
					.map((item) => `${item.filename}: ${item.reason ?? "revisar"}`)
					.join("\n");
			}

			if (q.includes("igv")) {
				const totalIgv = batch.invoices.reduce(
					(sum, item) => sum + (item.igv ?? 0),
					0,
				);
				return `IGV acumulado del batch: ${n(totalIgv)}`;
			}

			if (q.includes("declar") || q.includes("listo")) {
				return `${batch.ready} facturas listas para declarar. Usá "Ir a declarar" cuando estés conforme.`;
			}

			if (q.includes("cuánt") || q.includes("cuant")) {
				return batch.summary;
			}

			return `Batch actual: ${batch.summary}. Preguntame por errores, revisión, IGV o declaración.`;
		},
		[batch],
	);

	const ask = useCallback(
		(question: string) => {
			const trimmed = question.trim();
			if (!trimmed) return;

			const answer = answerLocally(trimmed);
			const userMsg: InboxConversationMessage = {
				id: `u-${Date.now()}`,
				role: "user",
				text: trimmed,
			};
			const assistantMsg: InboxConversationMessage = {
				id: `a-${Date.now()}`,
				role: "assistant",
				text: answer,
			};
			setMessages((current) => [...current, userMsg, assistantMsg]);
		},
		[answerLocally],
	);

	const suggestions = useMemo(
		() => [
			"¿Cuáles tienen error?",
			"¿Qué necesita revisión?",
			"¿Cuánto IGV tengo?",
			"Prepárame la declaración",
		],
		[],
	);

	return { messages, ask, suggestions };
}
