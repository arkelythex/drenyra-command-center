import { useCallback, useRef, useState } from "react";
import { getCompanyContext } from "@/lib/company-context";
import { buildApiUrl } from "@/lib/http-client";
import { INBOX_PROCESS_ENDPOINT } from "../inbox.config";
import type {
	BatchCompleteEvent,
	InboxStreamEvent,
	InboxUiPhase,
} from "../inbox.schema";

function parseSseBlock(block: string): InboxStreamEvent | null {
	const lines = block.split("\n");
	let eventType = "";
	let dataLine = "";

	for (const line of lines) {
		if (line.startsWith("event:")) {
			eventType = line.slice(6).trim();
		}
		if (line.startsWith("data:")) {
			dataLine = line.slice(5).trim();
		}
	}

	if (!eventType || !dataLine) return null;

	try {
		const payload = JSON.parse(dataLine) as InboxStreamEvent["payload"];
		return { type: eventType, payload } as InboxStreamEvent;
	} catch {
		return null;
	}
}

export interface UseInboxAgentStreamResult {
	phase: InboxUiPhase;
	events: InboxStreamEvent[];
	batch: BatchCompleteEvent | null;
	error: string | null;
	progress: { processed: number; total: number; percent: number } | null;
	processFiles: (files: File[]) => Promise<void>;
	reset: () => void;
}

/**
 * POST multipart to /api/inbox/process and parse SSE from response body.
 */
export function useInboxAgentStream(): UseInboxAgentStreamResult {
	const [phase, setPhase] = useState<InboxUiPhase>("idle");
	const [events, setEvents] = useState<InboxStreamEvent[]>([]);
	const [batch, setBatch] = useState<BatchCompleteEvent | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState<{
		processed: number;
		total: number;
		percent: number;
	} | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const reset = useCallback(() => {
		abortRef.current?.abort();
		setPhase("idle");
		setEvents([]);
		setBatch(null);
		setError(null);
		setProgress(null);
	}, []);

	const processFiles = useCallback(async (files: File[]) => {
		if (files.length === 0) return;

		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setPhase("uploading");
		setEvents([]);
		setBatch(null);
		setError(null);
		setProgress(null);

		const formData = new FormData();
		for (const file of files) {
			formData.append("files", file);
		}

		const { companyId } = getCompanyContext();
		const headers: Record<string, string> = {};
		if (companyId) {
			headers["x-company-id"] = companyId;
		}

		try {
			setPhase("processing");
			const response = await fetch(buildApiUrl(INBOX_PROCESS_ENDPOINT), {
				method: "POST",
				body: formData,
				headers,
				signal: controller.signal,
			});

			if (!response.ok) {
				const body = await response.json().catch(() => null);
				const message =
					typeof body === "object" &&
					body !== null &&
					"error" in body &&
					typeof (body as { error?: string }).error === "string"
						? (body as { error: string }).error
						: "No se pudo procesar el inbox";
				throw new Error(message);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Stream no disponible");
			}

			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const parts = buffer.split("\n\n");
				buffer = parts.pop() ?? "";

				for (const part of parts) {
					const parsed = parseSseBlock(part.trim());
					if (!parsed) continue;

					setEvents((current) => [...current, parsed]);

					if (parsed.type === "batch:progress") {
						setProgress(parsed.payload);
					}
					if (parsed.type === "batch:complete") {
						setBatch(parsed.payload);
						setPhase("complete");
					}
					if (
						parsed.type === "invoice:error" &&
						parsed.payload.invoiceId === "batch"
					) {
						throw new Error(parsed.payload.error);
					}
				}
			}

			setPhase((current) => (current === "processing" ? "complete" : current));
		} catch (caught) {
			if (controller.signal.aborted) return;
			setPhase("error");
			setError(
				caught instanceof Error ? caught.message : "Error procesando facturas",
			);
		}
	}, []);

	return {
		phase,
		events,
		batch,
		error,
		progress,
		processFiles,
		reset,
	};
}
