import { z } from "zod";
import { BaseConnector } from "../../base.connector";
import {
	type UnstructuredConfig,
	UnstructuredConfigSchema,
} from "../../config";
import { ConnectorAuthError, ConnectorError } from "../../errors";
import type {
	UnstructuredClassificationResult,
	UnstructuredElement,
	UnstructuredOperation,
	UnstructuredTableElement,
} from "./unstructured.types";

export class UnstructuredConnector extends BaseConnector<
	UnstructuredConfig,
	UnstructuredOperation
> {
	readonly name = "unstructured";
	constructor() {
		super();
		this._config = null as unknown as UnstructuredConfig;
	}
	private _config: UnstructuredConfig;
	override get config(): UnstructuredConfig {
		if (!this._config)
			throw new Error("Unstructured not connected. Call connect() first.");
		return this._config;
	}
	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = UnstructuredConfigSchema.parse({
				endpoint: process.env.DRENYRA_UNSTRUCTURED_ENDPOINT,
				apiKey: process.env.DRENYRA_UNSTRUCTURED_API_KEY,
			});
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof z.ZodError)
				throw new ConnectorError("Invalid Unstructured config", "unstructured");
			throw err;
		}
	}
	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}
	async execute<TResult>(
		operation: UnstructuredOperation,
		..._args: unknown[]
	): Promise<TResult> {
		return this.guardedExecute(async () => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 60_000);
			try {
				switch (operation.type) {
					case "document.chunk":
						return (await this.chunkDocument(
							operation,
							controller.signal,
						)) as TResult;
					case "document.extract":
						return (await this.extractDocument(
							operation,
							controller.signal,
						)) as TResult;
					case "document.table_extract":
						return (await this.extractTable(
							operation,
							controller.signal,
						)) as TResult;
					case "document.classify":
						return (await this.classifyDocument(
							operation,
							controller.signal,
						)) as TResult;
					case "server.health":
						return { status: "connected" } as TResult;
					default:
						throw new ConnectorError(
							`Unsupported operation: ${JSON.stringify(operation)}`,
							"unstructured",
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
				const r = await fetch(`${this.config.endpoint}/health`, {
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
		if (this.config.apiKey) h["unstructured-api-key"] = this.config.apiKey;
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
			throw new ConnectorAuthError("unstructured", `HTTP ${r.status}`);
		if (!r.ok)
			throw new ConnectorError(
				`Unstructured request failed: ${r.status}`,
				"unstructured",
			);
		return r.json() as Promise<T>;
	}
	private async chunkDocument(
		op: UnstructuredOperation & { type: "document.chunk" },
		signal?: AbortSignal,
	): Promise<UnstructuredElement[]> {
		return this.request<UnstructuredElement[]>(
			"POST",
			"/general/v0/general",
			{
				files: [{ filename: op.filename, content: op.fileContent }],
				strategy: op.strategy ?? "auto",
				chunking_strategy: "by_title",
			},
			signal,
		);
	}
	private async extractDocument(
		op: UnstructuredOperation & { type: "document.extract" },
		signal?: AbortSignal,
	): Promise<UnstructuredElement[]> {
		return this.request<UnstructuredElement[]>(
			"POST",
			"/general/v0/general",
			{
				files: [{ filename: op.filename, content: op.fileContent }],
				include_page_breaks: op.includePageBreaks ?? false,
				strategy: "hi_res",
			},
			signal,
		);
	}
	private async extractTable(
		op: UnstructuredOperation & { type: "document.table_extract" },
		signal?: AbortSignal,
	): Promise<UnstructuredTableElement[]> {
		const elements = await this.request<UnstructuredElement[]>(
			"POST",
			"/general/v0/general",
			{
				files: [{ filename: op.filename, content: op.fileContent }],
				strategy: "hi_res",
				include_page_breaks: false,
			},
			signal,
		);
		return elements.filter(
			(e): e is UnstructuredTableElement => e.type === "Table",
		);
	}
	private async classifyDocument(
		op: UnstructuredOperation & { type: "document.classify" },
		signal?: AbortSignal,
	): Promise<UnstructuredClassificationResult[]> {
		return this.request<UnstructuredClassificationResult[]>(
			"POST",
			"/general/v0/general",
			{
				files: [{ filename: op.filename, content: op.fileContent }],
				strategy: "auto",
			},
			signal,
		);
	}
}
