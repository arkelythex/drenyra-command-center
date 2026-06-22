/**
 * LLM Gateway SDK — Chat Request Builder.
 * Fluent API for building chat completion requests.
 */
import {
	type ChatCompletionRequest,
	type ChatMessage,
	type ChatTool,
	MESSAGE_ROLE,
	type RequestPriority,
} from "./types";

export class ChatRequestBuilder {
	private request: ChatCompletionRequest;
	private organizationId: number;
	private userId: string;

	constructor(
		model: string,
		organizationId: number,
		userId: string,
		provider?: ChatCompletionRequest["provider"],
	) {
		this.request = { model, messages: [], provider };
		this.organizationId = organizationId;
		this.userId = userId;
	}

	system(content: string): this {
		this.request.messages.push({ role: MESSAGE_ROLE.SYSTEM, content });
		return this;
	}
	user(content: string): this {
		this.request.messages.push({ role: MESSAGE_ROLE.USER, content });
		return this;
	}
	assistant(content: string): this {
		this.request.messages.push({ role: MESSAGE_ROLE.ASSISTANT, content });
		return this;
	}

	messages(messages: ChatMessage[]): this {
		this.request.messages.push(...messages);
		return this;
	}
	temperature(temp: number): this {
		this.request.temperature = Math.max(0, Math.min(2, temp));
		return this;
	}
	topP(topP: number): this {
		this.request.topP = Math.max(0, Math.min(1, topP));
		return this;
	}
	maxTokens(tokens: number): this {
		this.request.maxTokens = tokens;
		return this;
	}
	stop(stop: string | string[]): this {
		this.request.stop = stop;
		return this;
	}
	seed(seed: number): this {
		this.request.seed = seed;
		return this;
	}
	stream(): this {
		this.request.stream = true;
		return this;
	}
	tools(tools: ChatTool[]): this {
		this.request.tools = tools;
		return this;
	}

	toolChoice(
		choice: "none" | "auto" | { type: "function"; function: { name: string } },
	): this {
		this.request.toolChoice = choice;
		return this;
	}

	json(): this {
		this.request.responseFormat = { type: "json_object" };
		return this;
	}
	priority(priority: RequestPriority): this {
		this.request.priority = priority;
		return this;
	}
	metadata(metadata: Record<string, unknown>): this {
		this.request.metadata = metadata;
		return this;
	}

	build(): ChatCompletionRequest & { organizationId: number; userId: string } {
		return {
			...this.request,
			organizationId: this.organizationId,
			userId: this.userId,
		};
	}
}
