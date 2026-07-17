import { z } from "zod";
import { BaseConnector } from "../../base.connector";
import { type DoclingConfig, DoclingConfigSchema } from "../../config";
import { ConnectorError, ConnectorTimeoutError } from "../../errors";
import type {
	DoclingClassificationResult,
	DoclingExtractionResult,
	DoclingOperation,
	DocumentInput,
	ExtractionOptions,
} from "./docling.types";

/**
 * Docling connector — connects Drenyra to IBM Docling for AI document understanding.
 *
 * Handles:
 * - Document extraction (invoices, receipts → structured markdown + tables)
 * - Document classification (text → document type)
 *
 * Requires environment variable:
 * - DRENYRA_DOCLING_ENDPOINT (default: http://docling:5001)
 */
export class DoclingConnector extends BaseConnector<
	DoclingConfig,
	DoclingOperation
> {
	readonly name = "docling";

	constructor() {
		super();
		this._config = null as unknown as DoclingConfig;
	}

	private _config: DoclingConfig;
	override get config(): DoclingConfig {
		if (!this._config) {
			throw new Error("Docling connector not connected. Call connect() first.");
		}
		return this._config;
	}

	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = DoclingConfigSchema.parse({
				endpoint: process.env.DRENYRA_DOCLING_ENDPOINT || undefined,
				timeoutMs: process.env.DRENYRA_DOCLING_TIMEOUT_MS
					? Number(process.env.DRENYRA_DOCLING_TIMEOUT_MS)
					: undefined,
			});
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof z.ZodError) {
				throw new ConnectorError(
					`Invalid Docling configuration: ${err.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
					"docling",
				);
			}
			throw err;
		}
	}

	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}

	async execute<TResult>(
		operation: DoclingOperation,
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
					case "document.extract":
						return (await this.extractDocument(
							operation.document,
							operation.options,
							controller.signal,
						)) as TResult;
					case "document.classify":
						return (await this.classifyDocument(
							operation.text,
							controller.signal,
						)) as TResult;
					case "health":
						return (await this.healthCheck(controller.signal)) as TResult;
					default:
						throw new ConnectorError(
							`Unsupported operation: ${JSON.stringify(operation)}`,
							"docling",
						);
				}
			} finally {
				clearTimeout(timeout);
			}
		});
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
		signal?: AbortSignal,
	): Promise<T> {
		let response: Response;

		try {
			response = await fetch(`${this.config.endpoint}${path}`, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: body ? JSON.stringify(body) : undefined,
				signal,
			});
		} catch (err) {
			if ((err as Error).name === "AbortError") {
				throw new ConnectorTimeoutError("docling", this.config.timeoutMs);
			}
			throw new ConnectorError(
				`Docling request failed: ${(err as Error).message}`,
				"docling",
				err,
			);
		}

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			throw new ConnectorError(
				`Docling request failed: ${response.status} ${response.statusText}${errorBody.detail ? ` — ${errorBody.detail}` : ""}`,
				"docling",
			);
		}

		return response.json() as Promise<T>;
	}

	private async extractDocument(
		document: DocumentInput,
		options?: ExtractionOptions,
		signal?: AbortSignal,
	): Promise<DoclingExtractionResult> {
		return this.request<DoclingExtractionResult>(
			"POST",
			"/v1/documents/extract",
			{
				content: document.content,
				mime_type: document.mimeType,
				filename: document.filename,
				options: {
					extract_tables: options?.extractTables ?? true,
					extract_images: options?.extractImages ?? false,
					language: options?.language ?? "spa",
				},
			},
			signal,
		);
	}

	private async classifyDocument(
		text: string,
		signal?: AbortSignal,
	): Promise<DoclingClassificationResult> {
		return this.request<DoclingClassificationResult>(
			"POST",
			"/v1/documents/classify",
			{ text },
			signal,
		);
	}

	private async healthCheck(
		signal?: AbortSignal,
	): Promise<{ status: string; version: string }> {
		await this.request<{ status: string }>("GET", "/health", undefined, signal);
		return { status: "connected", version: "docling" };
	}
}
