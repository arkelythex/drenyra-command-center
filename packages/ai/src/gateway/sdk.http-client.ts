/**
 * LLM Gateway SDK — HTTP Client.
 * Handles HTTP communication with the gateway API.
 */
import type {
	ChatCompletionRequest,
	ChatCompletionResponse,
	ChatCompletionStreamChunk,
	ChatMessage,
} from "./types";

export class GatewayHttpClient {
	private baseUrl: string;
	private apiKey: string;
	private organizationId: number;
	private userId: string;
	private timeout: number;

	constructor(
		baseUrl: string,
		apiKey: string,
		organizationId: number,
		userId: string,
		timeout = 120000,
	) {
		this.baseUrl = baseUrl;
		this.apiKey = apiKey;
		this.organizationId = organizationId;
		this.userId = userId;
		this.timeout = timeout;
	}

	async chat(
		model: string,
		messages: ChatMessage[],
		options?: Partial<ChatCompletionRequest>,
	): Promise<ChatCompletionResponse> {
		const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`,
				"X-Organization-Id": String(this.organizationId),
				"X-User-Id": this.userId,
			},
			body: JSON.stringify({ model, messages, ...options }),
			signal: AbortSignal.timeout(this.timeout),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(
				error.message ?? `HTTP ${response.status}: ${response.statusText}`,
			);
		}

		return response.json();
	}

	async *streamChat(
		model: string,
		messages: ChatMessage[],
		options?: Partial<ChatCompletionRequest>,
	): AsyncGenerator<ChatCompletionStreamChunk> {
		const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`,
				"X-Organization-Id": String(this.organizationId),
				"X-User-Id": this.userId,
			},
			body: JSON.stringify({ model, messages, stream: true, ...options }),
			signal: AbortSignal.timeout(this.timeout),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(
				error.message ?? `HTTP ${response.status}: ${response.statusText}`,
			);
		}

		if (!response.body) throw new Error("No response body");

		const decoder = new TextDecoder();
		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const text = decoder.decode(value, { stream: true });
			const lines = text.split("\n").filter((line) => line.trim() !== "");

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					const data = line.slice(6);
					if (data === "[DONE]") return;
					try {
						yield JSON.parse(data);
					} catch {
						/* Skip invalid JSON */
					}
				}
			}
		}
	}
}
