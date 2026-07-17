import { BaseConnector } from "../../base.connector";
import { type TemporalConfig, TemporalConfigSchema } from "../../config";
import { ConnectorAuthError, ConnectorError } from "../../errors";
import type {
	TemporalApiResponse,
	TemporalOperation,
	TemporalWorkflowExecution,
	TemporalWorkflowResult,
} from "./temporal.types";

export class TemporalConnector extends BaseConnector<
	TemporalConfig,
	TemporalOperation
> {
	readonly name = "temporal";
	constructor() {
		super();
		this._config = null as unknown as TemporalConfig;
	}
	private _config: TemporalConfig;
	override get config(): TemporalConfig {
		if (!this._config)
			throw new Error("Temporal not connected. Call connect() first.");
		return this._config;
	}
	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = TemporalConfigSchema.parse({
				host: process.env.DRENYRA_TEMPORAL_HOST,
				namespace: process.env.DRENYRA_TEMPORAL_NAMESPACE,
				taskQueue: process.env.DRENYRA_TEMPORAL_TASK_QUEUE,
			});
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof Error)
				throw new ConnectorError(
					`Invalid Temporal config: ${err.message}`,
					"temporal",
				);
			throw err;
		}
	}
	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}
	async execute<TResult>(
		operation: TemporalOperation,
		..._args: unknown[]
	): Promise<TResult> {
		return this.guardedExecute(async () => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 30_000);
			try {
				switch (operation.type) {
					case "workflow.start":
						return (await this.startWorkflow(
							operation,
							controller.signal,
						)) as TResult;
					case "workflow.status":
						return (await this.getWorkflowStatus(
							operation,
							controller.signal,
						)) as TResult;
					case "workflow.result":
						return (await this.getWorkflowResult(
							operation,
							controller.signal,
						)) as TResult;
					case "schedule.create":
						return (await this.createSchedule(
							operation,
							controller.signal,
						)) as TResult;
					case "health":
						return { status: "connected" } as TResult;
					default:
						throw new ConnectorError(
							`Unsupported operation: ${JSON.stringify(operation)}`,
							"temporal",
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
				const r = await fetch(`http://${this.config.host}/api/v1/health`, {
					method: "GET",
					signal: controller.signal,
				});
				return r.ok;
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
		const r = await fetch(`http://${this.config.host}${path}`, {
			method,
			headers: { "Content-Type": "application/json" },
			body: body ? JSON.stringify(body) : undefined,
			signal,
		});
		if (r.status === 401 || r.status === 403)
			throw new ConnectorAuthError("temporal", `HTTP ${r.status}`);
		if (!r.ok)
			throw new ConnectorError(
				`Temporal request failed: ${r.status} ${r.statusText}`,
				"temporal",
			);
		return r.json() as Promise<T>;
	}
	private async startWorkflow(
		op: TemporalOperation & { type: "workflow.start" },
		signal?: AbortSignal,
	): Promise<TemporalWorkflowExecution> {
		return this.request<TemporalWorkflowExecution>(
			"POST",
			`/api/v1/namespaces/${this.config.namespace}/workflows/${op.workflowId ?? crypto.randomUUID()}`,
			{
				workflowType: { name: op.workflowType },
				taskQueue: { name: op.taskQueue },
				input: op.args,
			},
			signal,
		);
	}
	private async getWorkflowStatus(
		op: TemporalOperation & { type: "workflow.status" },
		signal?: AbortSignal,
	): Promise<TemporalWorkflowExecution> {
		return this.request<TemporalWorkflowExecution>(
			"GET",
			`/api/v1/namespaces/${this.config.namespace}/workflows/${op.workflowId}`,
			undefined,
			signal,
		);
	}
	private async getWorkflowResult(
		op: TemporalOperation & { type: "workflow.result" },
		signal?: AbortSignal,
	): Promise<TemporalWorkflowResult> {
		return this.request<TemporalWorkflowResult>(
			"GET",
			`/api/v1/namespaces/${this.config.namespace}/workflows/${op.workflowId}/result`,
			undefined,
			signal,
		);
	}
	private async createSchedule(
		op: TemporalOperation & { type: "schedule.create" },
		signal?: AbortSignal,
	): Promise<TemporalApiResponse<{ scheduleId: string }>> {
		return this.request<TemporalApiResponse<{ scheduleId: string }>>(
			"POST",
			`/api/v1/namespaces/${this.config.namespace}/schedules/${op.scheduleId}`,
			{
				schedule: {
					spec: { cronString: op.cronSchedule },
					action: {
						startWorkflow: {
							workflowType: { name: op.workflowType },
							taskQueue: { name: this.config.taskQueue },
							input: op.args,
						},
					},
				},
			},
			signal,
		);
	}
}
