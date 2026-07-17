import { z } from "zod";
import { BaseConnector } from "../../base.connector";
import { type MetabaseConfig, MetabaseConfigSchema } from "../../config";
import { ConnectorAuthError, ConnectorError } from "../../errors";
import type {
	MetabaseDashboard,
	MetabaseDashboardDetail,
	MetabaseOperation,
	MetabaseQuestionResult,
} from "./metabase.types";

export class MetabaseConnector extends BaseConnector<
	MetabaseConfig,
	MetabaseOperation
> {
	readonly name = "metabase";
	constructor() {
		super();
		this._config = null as unknown as MetabaseConfig;
	}
	private _config: MetabaseConfig;
	override get config(): MetabaseConfig {
		if (!this._config)
			throw new Error("Metabase not connected. Call connect() first.");
		return this._config;
	}
	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = MetabaseConfigSchema.parse({
				endpoint: process.env.DRENYRA_METABASE_ENDPOINT,
				apiKey: process.env.DRENYRA_METABASE_API_KEY,
				username: process.env.DRENYRA_METABASE_USERNAME,
				password: process.env.DRENYRA_METABASE_PASSWORD,
			});
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof z.ZodError)
				throw new ConnectorError("Invalid Metabase config", "metabase");
			throw err;
		}
	}
	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}
	async execute<TResult>(
		operation: MetabaseOperation,
		..._args: unknown[]
	): Promise<TResult> {
		return this.guardedExecute(async () => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 30_000);
			try {
				switch (operation.type) {
					case "dashboard.list":
						return (await this.listDashboards(
							operation,
							controller.signal,
						)) as TResult;
					case "dashboard.get":
						return (await this.getDashboard(
							operation,
							controller.signal,
						)) as TResult;
					case "question.run":
						return (await this.runQuestion(
							operation,
							controller.signal,
						)) as TResult;
					case "database.sync":
						return (await this.syncDatabase(
							operation,
							controller.signal,
						)) as TResult;
					case "health":
						return { status: "connected" } as TResult;
					default:
						throw new ConnectorError(
							`Unsupported operation: ${JSON.stringify(operation)}`,
							"metabase",
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
				const r = await fetch(`${this.config.endpoint}/api/health`, {
					method: "GET",
					headers: this.getAuthHeaders(),
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
	private getAuthHeaders(): Record<string, string> {
		const h: Record<string, string> = { "Content-Type": "application/json" };
		if (this.config.apiKey) h["X-API-KEY"] = this.config.apiKey;
		return h;
	}
	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
		signal?: AbortSignal,
	): Promise<T> {
		const r = await fetch(this.config.endpoint + path, {
			method,
			headers: this.getAuthHeaders(),
			body: body ? JSON.stringify(body) : undefined,
			signal,
		});
		if (r.status === 401 || r.status === 403)
			throw new ConnectorAuthError("metabase", `HTTP ${r.status}`);
		if (!r.ok)
			throw new ConnectorError(
				`Metabase request failed: ${r.status}`,
				"metabase",
			);
		return r.json() as Promise<T>;
	}
	private async listDashboards(
		_op: MetabaseOperation & { type: "dashboard.list" },
		signal?: AbortSignal,
	): Promise<MetabaseDashboard[]> {
		return this.request<MetabaseDashboard[]>(
			"GET",
			`/api/dashboard${_op.page ? `?page=${_op.page}` : ""}`,
			undefined,
			signal,
		);
	}
	private async getDashboard(
		op: MetabaseOperation & { type: "dashboard.get" },
		signal?: AbortSignal,
	): Promise<MetabaseDashboardDetail> {
		return this.request<MetabaseDashboardDetail>(
			"GET",
			`/api/dashboard/${op.dashboardId}`,
			undefined,
			signal,
		);
	}
	private async runQuestion(
		op: MetabaseOperation & { type: "question.run" },
		signal?: AbortSignal,
	): Promise<MetabaseQuestionResult> {
		return this.request<MetabaseQuestionResult>(
			"POST",
			`/api/card/${op.questionId}/query`,
			{ parameters: op.parameters },
			signal,
		);
	}
	private async syncDatabase(
		op: MetabaseOperation & { type: "database.sync" },
		signal?: AbortSignal,
	): Promise<{ success: boolean }> {
		await this.request<unknown>(
			"POST",
			`/api/database/${op.databaseId}/sync`,
			undefined,
			signal,
		);
		return { success: true };
	}
}
