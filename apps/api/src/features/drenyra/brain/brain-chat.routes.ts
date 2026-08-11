/**
 * Brain Chat — unified conversational endpoint that connects Drenyra Brain
 * with the LLM Gateway (DeepSeek V4 Flash) for real AI responses.
 *
 * Flow:
 *   1. Creates/gets thread in Brain
 *   2. Creates turn with user message
 *   3. Appends user message as item
 *   4. Calls LLM Gateway with DeepSeek V4 Flash
 *   5. Streams AI response via SSE
 *   6. Appends AI response as item
 *
 * This is the SAME core used by Drenyra CLI, Drenyra Web, and the LLM Gateway.
 */

import {
	extractStreamText,
	LLM_PROVIDER,
	llmGateway,
	systemMessage,
	userMessage,
} from "@drenyra/ai/gateway";
import { RUC } from "@drenyra/domain";
import { Elysia, t } from "elysia";
import type { DrenyraBrainRepository } from "./brain.repository";
import type { DrenyraBrainService } from "./brain.service";

// ─── Context resolution (shared pattern from brain.routes.ts) ───

interface ContextResolution {
	ok: boolean;
	missingHeaders: string[];
	invalidHeaders?: string[];
	organizationId?: string;
	companyId?: string;
	companyRuc?: string;
	period?: string;
	userId?: string;
}

function readHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string {
	return headers[key]?.trim() ?? "";
}

function resolveContext(
	headers: Record<string, string | undefined>,
): ContextResolution {
	const organizationId = readHeader(headers, "x-organization-id");
	const companyId = readHeader(headers, "x-company-id");
	const companyRuc = readHeader(headers, "x-company-ruc");
	const period = readHeader(headers, "x-fiscal-period");
	const userId = readHeader(headers, "x-user-id");

	const missingHeaders = [
		...(organizationId ? [] : ["x-organization-id"]),
		...(companyId ? [] : ["x-company-id"]),
		...(companyRuc ? [] : ["x-company-ruc"]),
		...(period ? [] : ["x-fiscal-period"]),
		...(userId ? [] : ["x-user-id"]),
	];

	const invalidHeaders =
		companyRuc && !RUC.isValid(companyRuc) ? ["x-company-ruc"] : [];

	if (missingHeaders.length > 0 || invalidHeaders.length > 0) {
		return { ok: false, missingHeaders, invalidHeaders };
	}

	return {
		ok: true,
		missingHeaders: [],
		organizationId,
		companyId,
		companyRuc,
		period,
		userId,
	};
}

function contextError(context: ContextResolution) {
	const hasInvalidHeaders = (context.invalidHeaders?.length ?? 0) > 0;
	return {
		error: hasInvalidHeaders
			? "Requests require a valid SUNAT RUC"
			: "Requests require tenant and user scope headers",
		code: hasInvalidHeaders ? "INVALID_RUC" : "TENANT_CONTEXT_REQUIRED",
		details: {
			missingHeaders: context.missingHeaders,
			invalidHeaders: context.invalidHeaders ?? [],
		},
	};
}

// ─── Chat endpoint ───

export function createBrainChatRoutes(deps: {
	repository: DrenyraBrainRepository;
	service: DrenyraBrainService;
}) {
	const { repository, service } = deps;

	function generateId(prefix: string): string {
		return `${prefix}_${crypto.randomUUID()}`;
	}

	function now(): string {
		return new Date().toISOString();
	}

	return new Elysia({
		prefix: "/api/drenyra/brain",
		name: "drenyra-brain-chat",
	}).post(
		"/chat",
		async ({ body, headers, set, request }) => {
			const context = resolveContext(headers);
			if (!context.ok) {
				set.status = 400;
				return contextError(context);
			}

			const fiscalScope = {
				organizationId: context.organizationId!,
				companyId: context.companyId!,
				companyRuc: context.companyRuc!,
				period: context.period!,
				countryCode: "PE" as const,
			};

			// 1. Get or create thread
			let threadId = body.threadId;
			if (!threadId) {
				const thread = await service.createThread({
					title:
						body.message.length > 60
							? `${body.message.slice(0, 57)}...`
							: body.message,
					sourceSurface: "web",
					createdBy: context.userId!,
					fiscalScope,
				});
				threadId = thread.id;
			}

			// 2. Create turn for user message
			const turn = await service.startTurn({
				threadId,
				prompt: body.message,
				sourceSurface: "web",
				createdBy: context.userId!,
				fiscalScope,
			});

			// 3. Append user message as item
			await repository.appendItem({
				id: generateId("item"),
				threadId,
				turnId: turn.id,
				fiscalScope,
				type: "user_message",
				content: { text: body.message },
				...(context.userId !== undefined ? { actorId: context.userId } : {}),
				sourceSurface: "web",
				createdAt: now(),
			});

			// 4. Call LLM Gateway with DeepSeek V4 Flash
			const stream = llmGateway.streamChat({
				model: "deepseek-chat",
				provider: LLM_PROVIDER.DEEPSEEK,
				messages: [
					systemMessage(
						"Eres Drenyra, el asistente fiscal inteligente de ARKELYTHEX. " +
							"Responde de forma clara y precisa en español. " +
							"Usa terminología fiscal peruana (IGV, RUC, SUNAT, detracciones, retenciones) cuando sea pertinente.",
					),
					userMessage(body.message),
				],
				temperature: 0.3,
				maxTokens: 4096,
				stream: true,
				organizationId: Number(context.organizationId!) || 1,
				userId: context.userId!,
			});

			// 5. Stream response via SSE + collect full response
			const encoder = new TextEncoder();
			let fullResponse = "";

			const sseStream = new ReadableStream<Uint8Array>({
				async start(controller) {
					let isClosed = false;

					function emit(event: string, payload: unknown) {
						if (isClosed) return;
						try {
							controller.enqueue(
								encoder.encode(
									`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
								),
							);
						} catch {
							/* ignore */
						}
					}

					function close() {
						if (isClosed) return;
						isClosed = true;
						try {
							controller.close();
						} catch {
							/* ignore */
						}
					}

					request.signal.addEventListener("abort", close, { once: true });

					try {
						for await (const chunk of stream) {
							const token = extractStreamText(chunk);
							if (token) {
								fullResponse += token;
								emit("token", { token });
							}

							// Check if this is the final chunk (has usage info)
							if (chunk.usage) {
								emit("usage", {
									promptTokens: chunk.usage.promptTokens,
									completionTokens: chunk.usage.completionTokens,
									totalTokens: chunk.usage.totalTokens,
								});
							}
						}

						// 6. Append AI response as item
						await repository.appendItem({
							id: generateId("item"),
							threadId,
							turnId: turn.id,
							fiscalScope,
							type: "assistant_message",
							content: { text: fullResponse },
							actorId: "drenyra-ai",
							sourceSurface: "web",
							createdAt: now(),
						});

						emit("done", {
							threadId,
							turnId: turn.id,
							responseLength: fullResponse.length,
						});
					} catch (error) {
						emit("error", {
							error:
								error instanceof Error
									? error.message
									: "Unknown error during AI generation",
						});
					} finally {
						close();
					}
				},
			});

			return new Response(sseStream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache, no-transform",
					Connection: "keep-alive",
					"X-Accel-Buffering": "no",
					"X-Thread-Id": threadId,
					"X-Turn-Id": turn.id,
				},
			});
		},
		{
			body: t.Object({
				message: t.String({ minLength: 1 }),
				threadId: t.Optional(t.String()),
			}),
		},
	);
}

export { createInMemoryDrenyraBrainRepository } from "./brain.repository";
// ─── Re-export for mounting ───
export { createDrenyraBrainService } from "./brain.service";
