import type { AgentContext } from "@arkelythex/drenyra-orchestrator";
import { Elysia, t } from "elysia";
import {
	drenyraContextFailure,
	resolveAgentContextFromHeaders,
} from "./drenyra-context";

interface DrenyraChatIntent {
	agent: string;
	tool: string;
	confidence: number;
}

interface DrenyraChatResult {
	sessionId: string;
	agent: string;
	intent: DrenyraChatIntent;
	result:
		| { ok: true; data: unknown }
		| { ok: false; error: string; code?: string; details?: unknown };
}

export interface DrenyraChatOrchestrator {
	handleInput(
		message: string,
		context: AgentContext,
		sessionId?: string,
	): Promise<DrenyraChatResult>;
}

export interface DrenyraIntentDetector {
	detectIntent(message: string, context: AgentContext): Promise<DrenyraChatIntent>;
}

export interface ChatRoutesDeps {
	drenyra: DrenyraChatOrchestrator;
	intentDetector: DrenyraIntentDetector;
}

function toSseChunk(event: string, payload: unknown): string {
	return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function isStringResult(
	result: { ok: true; data: unknown } | { ok: false; error: string },
): result is { ok: true; data: string } {
	return result.ok && typeof result.data === "string";
}

export function createChatRoutes({ drenyra, intentDetector }: ChatRoutesDeps) {
	return new Elysia({ name: "drenyra-chat-routes" })
		.post(
			"/chat",
			async ({ body, headers, set }) => {
				const contextResolution = resolveAgentContextFromHeaders(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraContextFailure(contextResolution);
				}

				const result = await drenyra.handleInput(
					body.message,
					contextResolution.context,
					body.sessionId,
				);
				return {
					ok: true,
					sessionId: result.sessionId,
					agent: result.agent,
					intent: {
						agent: result.intent.agent,
						tool: result.intent.tool,
						confidence: result.intent.confidence,
					},
					result: result.result,
				};
			},
			{
				body: t.Object({
					message: t.String({ minLength: 1 }),
					sessionId: t.Optional(t.String()),
				}),
			},
		)
		.get(
			"/chat/stream",
			async ({ query, headers, request }) => {
				const contextResolution = resolveAgentContextFromHeaders(headers);
				if (!contextResolution.ok) {
					return Response.json(drenyraContextFailure(contextResolution), {
						status: 400,
					});
				}

				const encoder = new TextEncoder();
				const stream = new ReadableStream<Uint8Array>({
					async start(controller) {
						let isClosed = false;

						const emit = (event: string, payload: unknown) => {
							if (isClosed) return;
							controller.enqueue(encoder.encode(toSseChunk(event, payload)));
						};

						const close = () => {
							if (isClosed) return;
							isClosed = true;
							try {
								controller.close();
							} catch {
								/* already closed */
							}
						};

						request.signal.addEventListener("abort", close, { once: true });

						try {
							const intent = await intentDetector.detectIntent(
								query.message,
								contextResolution.context,
							);
							emit("intent", {
								agent: intent.agent,
								tool: intent.tool,
								confidence: intent.confidence,
							});

							const result = await drenyra.handleInput(
								query.message,
								contextResolution.context,
								query.sessionId,
							);

							if (isStringResult(result.result)) {
								const chunkSize = 50;
								const text = result.result.data;
								for (let i = 0; i < text.length; i += chunkSize) {
									emit("token", { token: text.slice(i, i + chunkSize) });
								}
							}

							emit("result", {
								ok: result.result.ok,
								data: result.result.ok ? result.result.data : undefined,
								error: result.result.ok ? undefined : result.result.error,
								code: result.result.ok ? undefined : result.result.code,
								details: result.result.ok ? undefined : result.result.details,
								sessionId: result.sessionId,
								agent: result.agent,
							});
						} catch (error) {
							emit("error", {
								error: error instanceof Error ? error.message : "Unknown error",
							});
						} finally {
							emit("done", {});
							close();
						}
					},
				});

				return new Response(stream, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache, no-transform",
						Connection: "keep-alive",
						"X-Accel-Buffering": "no",
					},
				});
			},
			{
				query: t.Object({
					message: t.String({ minLength: 1 }),
					sessionId: t.Optional(t.String()),
				}),
			},
		);
}
