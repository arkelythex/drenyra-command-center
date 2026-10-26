/**
 * Asks Drenyra a free-text question through the session-authorized
 * `POST /api/ai-swarm/cognitive-stream` endpoint (SSE). Same transport as the
 * rest of the app: session cookie plus the active company's tenant headers.
 * Tools are disabled: this is a question, not an action on the books.
 */
import { resolveRequestHeaders } from "@/lib/api-client";
import { runtimeConfig } from "@/lib/runtime-config";
import { parseSse, type SseEvent } from "./sse";

export type AskEvent = { type: "token"; text: string } | { type: "done" };

export type AskErrorKind =
	| "unauthenticated"
	| "forbidden"
	| "unavailable"
	| "stream"
	| "network";

export class AskError extends Error {
	constructor(
		readonly kind: AskErrorKind,
		message: string,
	) {
		super(message);
		this.name = "AskError";
	}
}

function errorForStatus(status: number): AskError {
	if (status === 401)
		return new AskError(
			"unauthenticated",
			"Inicia sesión para preguntarle a Drenyra.",
		);
	if (status === 403)
		return new AskError(
			"forbidden",
			"No tienes permiso para consultar esta empresa.",
		);
	return new AskError(
		"unavailable",
		"Drenyra no puede responder ahora en este entorno.",
	);
}

interface StreamAskOptions {
	companyId: string;
	question: string;
	signal?: AbortSignal;
}

async function openStream({
	companyId,
	question,
	signal,
}: StreamAskOptions): Promise<ReadableStream<Uint8Array>> {
	let response: Response;
	try {
		response = await fetch(
			`${runtimeConfig.apiUrl}/api/ai-swarm/cognitive-stream`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					...resolveRequestHeaders(),
				},
				body: JSON.stringify({
					companyId,
					messages: [{ role: "user", content: question }],
					modelTier: "fast",
					tools: false,
				}),
				...(signal ? { signal } : {}),
			},
		);
	} catch (cause) {
		if (cause instanceof DOMException && cause.name === "AbortError")
			throw cause;
		throw new AskError(
			"network",
			"No pudimos conectar con Drenyra. Revisa tu conexión.",
		);
	}
	if (!response.ok || !response.body) throw errorForStatus(response.status);
	return response.body;
}

async function* readSse(
	body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { value, done } = await reader.read();
		if (done) return;
		const parsed = parseSse(buffer + decoder.decode(value, { stream: true }));
		buffer = parsed.rest;
		yield* parsed.events;
	}
}

/** Maps a cognitive-stream event to what the composer shows; tool and usage events are ignored. */
function toAskEvent({ event, data }: SseEvent): AskEvent | null {
	const payload = data as { content?: unknown };
	if (event === "token" && typeof payload.content === "string")
		return { type: "token", text: payload.content };
	if (event === "done") return { type: "done" };
	if (event === "error")
		throw new AskError(
			"stream",
			"Drenyra no pudo completar la respuesta. Inténtalo de nuevo.",
		);
	return null;
}

export async function* streamAsk(
	options: StreamAskOptions,
): AsyncGenerator<AskEvent> {
	const body = await openStream(options);
	for await (const sseEvent of readSse(body)) {
		const askEvent = toAskEvent(sseEvent);
		if (askEvent) yield askEvent;
	}
}
