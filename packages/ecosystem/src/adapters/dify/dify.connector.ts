import { z } from "zod";
import { BaseConnector } from "../../base.connector";
import { type DifyConfig, DifyConfigSchema } from "../../config";
import { ConnectorAuthError, ConnectorError } from "../../errors";
import type {
	DifyChatResponse,
	DifyConversation,
	DifyKnowledgeRetrievalResponse,
	DifyOperation,
	DifyWorkflowRunResponse,
} from "./dify.types";

export class DifyConnector extends BaseConnector<DifyConfig, DifyOperation> {
	readonly name = "dify";

	constructor() {
		super();
		this._config = null as unknown as DifyConfig;
	}

	private _config: DifyConfig;
	override get config(): DifyConfig {
		if (!this._config) {
			throw new Error("Dify connector not connected. Call connect() first.");
		}
		return this._config;
	}

	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = DifyConfigSchema.parse({
				endpoint: process.env.DRENYRA_DIFY_ENDPOINT,
				apiKey: process.env.DRENYRA_DIFY_API_KEY,
				timeoutMs: process.env.DRENYRA_DIFY_TIMEOUT_MS
					? Number(process.env.DRENYRA_DIFY_TIMEOUT_MS)
					: undefined,
			});
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof z.ZodError) {
				throw new ConnectorError(
					`Invalid Dify configuration: ${err.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
					"dify",
				);
			}
			throw err;
		}
	}

	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}

	async execute<TResult>(
		operation: DifyOperation,
		..._args: unknown[]
	): Promise<TResult> {
		return this.guardedExecute(async () => {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				this.config.timeoutMs,
			);

			try {
				switch (operation.type) {
					case "chat.message":
						return (await this.sendChatMessage(
							operation,
							controller.signal,
						)) as TResult;
					case "chat.conversations":
						return (await this.listConversations(
							operation,
							controller.signal,
						)) as TResult;
					case "workflow.run":
						return (await this.runWorkflow(
							operation,
							controller.signal,
						)) as TResult;
					case "workflow.status":
						return (await this.getWorkflowStatus(
							operation,
							controller.signal,
						)) as TResult;
					case "knowledge.retrieve":
						return (await this.retrieveKnowledge(
							operation,
							controller.signal,
						)) as TResult;
					case "health":
						return { status: "connected" } as TResult;
					default:
						throw new ConnectorError(
							`Unsupported operation: ${JSON.stringify(operation)}`,
							"dify",
						);
				}
			} finally {
				clearTimeout(timeout);
			}
		});
	}

	override async performHealthCheck(): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				this.healthCheckTimeoutMs,
			);
			try {
				const response = await fetch(`${this.config.endpoint}/health`, {
					method: "GET",
					signal: controller.signal,
				});
				return response.ok;
			} finally {
				clearTimeout(timeout);
			}
		} catch {
			return false;
		}
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
		signal?: AbortSignal,
	): Promise<T> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		headers.Authorization = `Bearer ${this.config.apiKey}`;

		const response = await fetch(`${this.config.endpoint}${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
			signal,
		});

		if (response.status === 401 || response.status === 403) {
			throw new ConnectorAuthError("dify", `HTTP ${response.status}`);
		}

		if (!response.ok) {
			throw new ConnectorError(
				`Dify request failed: ${response.status} ${response.statusText}`,
				"dify",
			);
		}

		return response.json() as Promise<T>;
	}

	private async sendChatMessage(
		op: DifyOperation & { type: "chat.message" },
		signal?: AbortSignal,
	): Promise<DifyChatResponse> {
		return this.request<DifyChatResponse>(
			"POST",
			"/v1/chat-messages",
			{
				query: op.query,
				user: op.user ?? "drenyra",
				inputs: op.inputs,
				conversation_id: op.conversationId,
				response_mode: "blocking",
			},
			signal,
		);
	}

	private async listConversations(
		op: DifyOperation & { type: "chat.conversations" },
		signal?: AbortSignal,
	): Promise<DifyConversation[]> {
		const params = new URLSearchParams();
		if (op.user) params.set("user", op.user);
		if (op.limit) params.set("limit", String(op.limit));
		const query = params.toString();
		return this.request<DifyConversation[]>(
			"GET",
			`/v1/conversations${query ? `?${query}` : ""}`,
			undefined,
			signal,
		);
	}

	private async runWorkflow(
		op: DifyOperation & { type: "workflow.run" },
		signal?: AbortSignal,
	): Promise<DifyWorkflowRunResponse> {
		return this.request<DifyWorkflowRunResponse>(
			"POST",
			"/v1/workflows/run",
			{
				inputs: op.inputs,
				user: op.user ?? "drenyra",
				response_mode: "blocking",
			},
			signal,
		);
	}

	private async getWorkflowStatus(
		op: DifyOperation & { type: "workflow.status" },
		signal?: AbortSignal,
	): Promise<DifyWorkflowRunResponse> {
		return this.request<DifyWorkflowRunResponse>(
			"GET",
			`/v1/workflows/run/${op.runId}`,
			undefined,
			signal,
		);
	}

	private async retrieveKnowledge(
		op: DifyOperation & { type: "knowledge.retrieve" },
		signal?: AbortSignal,
	): Promise<DifyKnowledgeRetrievalResponse> {
		return this.request<DifyKnowledgeRetrievalResponse>(
			"POST",
			`/v1/datasets/${op.datasetId}/retrieve`,
			{
				query: op.query,
				top_k: op.topK,
			},
			signal,
		);
	}
}
