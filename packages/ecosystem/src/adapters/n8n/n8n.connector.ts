import { z } from "zod";
import { BaseConnector } from "../../base.connector";
import { type N8nConfig, N8nConfigSchema } from "../../config";
import { ConnectorAuthError, ConnectorError } from "../../errors";
import type {
	N8nApiResponse,
	N8nExecutionStatus,
	N8nOperation,
	N8nWorkflow,
} from "./n8n.types";

export class N8nConnector extends BaseConnector<N8nConfig, N8nOperation> {
	readonly name = "n8n";

	constructor() {
		super();
		this._config = null as unknown as N8nConfig;
	}

	private _config: N8nConfig;
	override get config(): N8nConfig {
		if (!this._config) {
			throw new Error("N8N connector not connected. Call connect() first.");
		}
		return this._config;
	}

	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = N8nConfigSchema.parse({
				endpoint: process.env.DRENYRA_N8N_ENDPOINT,
				apiKey: process.env.DRENYRA_N8N_API_KEY,
				webhookPrefix: process.env.DRENYRA_N8N_WEBHOOK_PREFIX,
				timeoutMs: process.env.DRENYRA_N8N_TIMEOUT_MS
					? Number(process.env.DRENYRA_N8N_TIMEOUT_MS)
					: undefined,
			});
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof z.ZodError) {
				throw new ConnectorError(
					`Invalid N8N configuration: ${err.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
					"n8n",
				);
			}
			throw err;
		}
	}

	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}

	async execute<TResult>(
		operation: N8nOperation,
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
					case "workflow.trigger":
						return (await this.triggerWorkflow(
							operation.workflowId,
							operation.payload,
							controller.signal,
						)) as TResult;
					case "workflow.status":
						return (await this.getExecutionStatus(
							operation.executionId,
							controller.signal,
						)) as TResult;
					case "workflow.list":
						return (await this.listWorkflows(controller.signal)) as TResult;
					case "health":
						return { status: "connected", version: "n8n" } as TResult;
					default:
						throw new ConnectorError(
							`Unsupported operation: ${JSON.stringify(operation)}`,
							"n8n",
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
				const response = await fetch(`${this.config.endpoint}/healthz`, {
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
		endpoint: string,
		body?: unknown,
		signal?: AbortSignal,
	): Promise<N8nApiResponse<T>> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (this.config.apiKey) {
			headers.Authorization = `Bearer ${this.config.apiKey}`;
		}

		const response = await fetch(`${this.config.endpoint}${endpoint}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
			signal,
		});

		if (response.status === 401 || response.status === 403) {
			throw new ConnectorAuthError("n8n", `HTTP ${response.status}`);
		}

		if (!response.ok) {
			throw new ConnectorError(
				`N8N request failed: ${response.status} ${response.statusText}`,
				"n8n",
			);
		}

		return response.json() as Promise<N8nApiResponse<T>>;
	}

	private async triggerWorkflow(
		workflowId: string,
		payload: Record<string, unknown>,
		signal?: AbortSignal,
	): Promise<{ executionId: string }> {
		const webhookUrl = `${this.config.webhookPrefix}${workflowId}`;
		const response = await fetch(`${this.config.endpoint}${webhookUrl}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			signal,
		});

		if (!response.ok) {
			throw new ConnectorError(
				`N8N workflow trigger failed: ${response.status} ${response.statusText}`,
				"n8n",
			);
		}

		return {
			executionId: response.headers.get("x-execution-id") ?? workflowId,
		};
	}

	private async getExecutionStatus(
		executionId: string,
		signal?: AbortSignal,
	): Promise<N8nExecutionStatus> {
		const result = await this.request<N8nExecutionStatus>(
			"GET",
			`/rest/executions/${executionId}`,
			undefined,
			signal,
		);
		return result.data;
	}

	private async listWorkflows(signal?: AbortSignal): Promise<N8nWorkflow[]> {
		const result = await this.request<N8nWorkflow[]>(
			"GET",
			"/rest/workflows",
			undefined,
			signal,
		);
		return result.data;
	}
}
