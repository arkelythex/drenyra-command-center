/**
 * LLM Gateway — Chat Completions route.
 * Handles POST /chat/completions with streaming and non-streaming support.
 */
import {
	type AuthenticatedChatRequest,
	type ChatCompletionRequest,
	chatCompletionRequestSchema,
	llmGateway,
} from "@drenyra/ai/gateway";
import { Elysia, t } from "elysia";
import { createLogger } from "../../lib/logger";
import { authorizeAiSurface } from "../security/ai-surface-access";
import { handleLLMError, toHeaderRecord } from "./helpers";

const logger = createLogger({ module: "llm-gateway/chat" });

export const chatCompletionsRoute = new Elysia({
	name: "llm-gateway-chat",
}).post(
	"/chat/completions",
	async ({ body, request, set }) => {
		const access = await authorizeAiSurface({
			headers: toHeaderRecord(request.headers),
			operation: "cognitive:stream",
			resource: "/api/v1/chat/completions",
		});

		if (access.ok === false) {
			set.status = access.status;
			return {
				success: false,
				error: {
					code: access.code,
					message: access.error,
				},
			};
		}

		const parsed = chatCompletionRequestSchema.safeParse(body);
		if (!parsed.success) {
			set.status = 400;
			return {
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request body",
					issues: parsed.error.issues.map((issue) => ({
						path: issue.path,
						message: issue.message,
					})),
				},
			};
		}

		const chatRequest = parsed.data as ChatCompletionRequest;

		if (chatRequest.stream) {
			const encoder = new TextEncoder();
			const stream = new ReadableStream<Uint8Array>({
				async start(controller) {
					const sendChunk = (data: unknown) => {
						controller.enqueue(
							encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
						);
					};

					const sendError = (error: unknown) => {
						const errorResponse = handleLLMError(error);
						controller.enqueue(
							encoder.encode(
								`data: ${JSON.stringify({ error: errorResponse.error })}\n\n`,
							),
						);
						controller.enqueue(encoder.encode("data: [DONE]\n\n"));
						controller.close();
					};

					try {
						const authenticatedRequest: AuthenticatedChatRequest = {
							...chatRequest,
							organizationId: access.context.organizationId,
							userId: access.context.userId,
						};

						sendChunk({
							type: "start",
							timestamp: new Date().toISOString(),
						});

						const streamGenerator =
							await llmGateway.streamChat(authenticatedRequest);

						for await (const chunk of streamGenerator) {
							sendChunk({
								type: "chunk",
								data: chunk,
							});
						}

						sendChunk({
							type: "done",
							timestamp: new Date().toISOString(),
						});
					} catch (error) {
						logger.error(
							{
								error,
								organizationId: access.context.organizationId,
								userId: access.context.authUserId,
							},
							"Streaming error",
						);
						sendError(error);
					} finally {
						controller.close();
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
		}

		try {
			const authenticatedRequest: AuthenticatedChatRequest = {
				...chatRequest,
				organizationId: access.context.organizationId,
				userId: access.context.userId,
			};

			const response = await llmGateway.chat(authenticatedRequest);

			logger.info(
				{
					organizationId: access.context.organizationId,
					userId: access.context.authUserId,
					role: access.context.role,
					provider: authenticatedRequest.provider ?? "default",
				},
				"LLM chat completion authorized",
			);

			return {
				success: true,
				data: response,
			};
		} catch (error) {
			const errorResponse = handleLLMError(error);
			set.status = errorResponse.status;
			return errorResponse;
		}
	},
	{
		body: t.Object({
			model: t.String({ minLength: 1 }),
			provider: t.Optional(
				t.Union([
					t.Literal("anthropic"),
					t.Literal("openai"),
					t.Literal("google"),
					t.Literal("grok"),
					t.Literal("openrouter"),
					t.Literal("ollama"),
				]),
			),
			messages: t.Array(
				t.Object({
					role: t.Union([
						t.Literal("system"),
						t.Literal("user"),
						t.Literal("assistant"),
						t.Literal("tool"),
					]),
					content: t.String({ minLength: 1 }),
					name: t.Optional(t.String()),
					toolCallId: t.Optional(t.String()),
				}),
				{ minItems: 1 },
			),
			temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
			topP: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
			maxTokens: t.Optional(t.Number({ minimum: 1 })),
			stop: t.Optional(t.Union([t.String(), t.Array(t.String())])),
			seed: t.Optional(t.Number()),
			stream: t.Optional(t.Boolean()),
			tools: t.Optional(
				t.Array(
					t.Object({
						type: t.Literal("function"),
						function: t.Object({
							name: t.String({ minLength: 1 }),
							description: t.Optional(t.String()),
							parameters: t.Record(t.String(), t.Unknown()),
						}),
					}),
				),
			),
			toolChoice: t.Optional(
				t.Union([
					t.Literal("none"),
					t.Literal("auto"),
					t.Object({
						type: t.Literal("function"),
						function: t.Object({
							name: t.String(),
						}),
					}),
				]),
			),
			responseFormat: t.Optional(
				t.Object({
					type: t.Literal("json_object"),
				}),
			),
			priority: t.Optional(
				t.Union([t.Literal("low"), t.Literal("normal"), t.Literal("high")]),
			),
			metadata: t.Optional(t.Record(t.String(), t.Unknown())),
		}),
		detail: {
			summary: "Chat completion",
			description:
				"Unified chat completion endpoint with multi-provider support.",
			tags: ["LLM Gateway"],
		},
	},
);
