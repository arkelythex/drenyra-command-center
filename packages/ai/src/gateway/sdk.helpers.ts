/**
 * LLM Gateway SDK — Helpers.
 * Message creation, text extraction, and type guards.
 */

import type {
	ChatCompletionResponse,
	ChatCompletionStreamChunk,
	ChatMessage,
	MessageRole,
} from "./types";
import { LLMGatewayError, MESSAGE_ROLE } from "./types";

export function createMessage(
	role: MessageRole,
	content: string,
	name?: string,
	toolCallId?: string,
): ChatMessage {
	return { role, content, name, toolCallId };
}

export function systemMessage(content: string): ChatMessage {
	return createMessage(MESSAGE_ROLE.SYSTEM, content);
}
export function userMessage(content: string): ChatMessage {
	return createMessage(MESSAGE_ROLE.USER, content);
}
export function assistantMessage(content: string): ChatMessage {
	return createMessage(MESSAGE_ROLE.ASSISTANT, content);
}
export function toolMessage(content: string, toolCallId: string): ChatMessage {
	return createMessage(MESSAGE_ROLE.TOOL, content, undefined, toolCallId);
}

export function extractText(response: ChatCompletionResponse): string {
	const choice = response.choices[0];
	return choice?.message.content ?? "";
}

export function extractStreamText(chunk: ChatCompletionStreamChunk): string {
	return chunk.choices[0]?.delta?.content ?? "";
}

export function isLLMGatewayError(error: unknown): error is LLMGatewayError {
	return (
		error instanceof
		(LLMGatewayError as unknown as new (
			...args: unknown[]
		) => LLMGatewayError)
	);
}
