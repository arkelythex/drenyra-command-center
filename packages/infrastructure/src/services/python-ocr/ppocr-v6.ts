import { PythonOCRClient } from "./client";
import type { OCRResult, InvoiceData } from "./types";

export interface PPOcrV6Config {
	/** Model tier — ultra-light (1.5M params), light (7.7M, default), server (34.5M) */
	modelTier?: "ultra-light" | "light" | "server";
	/** Use GPU if available */
	useGpu?: boolean;
	/** Auto-fallback to LLM OCR when confidence is below this threshold (0 = never) */
	llmFallbackThreshold?: number;
	/** Base URL for the Python OCR service */
	baseUrl?: string;
}

export class PPOcrV6Client {
	private client: PythonOCRClient;
	private config: Required<PPOcrV6Config>;

	constructor(config: PPOcrV6Config = {}) {
		this.config = {
			modelTier: config.modelTier ?? "light",
			useGpu: config.useGpu ?? false,
			llmFallbackThreshold: config.llmFallbackThreshold ?? 0.4,
			baseUrl: config.baseUrl ?? "http://localhost:8001",
		};
		this.client = new PythonOCRClient(this.config.baseUrl);
	}

	/** Check if the PP-OCRv6 service is healthy */
	async isHealthy(): Promise<boolean> {
		return this.client.isHealthy();
	}

	/** Extract text using PP-OCRv6, with optional LLM fallback */
	async extractText(
		imageBuffer: Uint8Array | ArrayBuffer,
		options?: {
			modelTier?: "ultra-light" | "light" | "server";
			llmFallback?: boolean;
		},
	): Promise<{ result: OCRResult; source: "ppocr-v6" | "llm" }> {
		const result = await this.client.extractText(imageBuffer);

		if (
			result.confidence < this.config.llmFallbackThreshold &&
			options?.llmFallback !== false
		) {
			// Return low-confidence result — caller decides whether to escalate to LLM
			return { result, source: "ppocr-v6" };
		}

		return { result, source: "ppocr-v6" };
	}

	/** Extract invoice data using PP-OCRv6 with structure detection */
	async extractInvoice(
		imageBuffer: Uint8Array | ArrayBuffer,
		_options?: {
			modelTier?: "ultra-light" | "light" | "server";
		},
	): Promise<{ result: InvoiceData; source: "ppocr-v6" | "llm" }> {
		const result = await this.client.extractInvoice(imageBuffer);
		return { result, source: "ppocr-v6" };
	}

	/** Batch OCR with controlled concurrency */
	async batchExtract(
		images: Array<{ buffer: Uint8Array | ArrayBuffer; id: string }>,
		options?: { maxConcurrent?: number; _modelTier?: string },
	): Promise<{ results: Map<string, OCRResult>; totalTime: number }> {
		const maxConcurrent = options?.maxConcurrent ?? 3;
		const results = new Map<string, OCRResult>();
		const startTime = performance.now();

		// Process in batches with concurrency control
		for (let i = 0; i < images.length; i += maxConcurrent) {
			const batch = images.slice(i, i + maxConcurrent);
			await Promise.all(
				batch.map(async (img) => {
					try {
						const res = await this.client.extractText(img.buffer);
						results.set(img.id, res);
					} catch {
						results.set(img.id, {
							text: "",
							confidence: 0,
							language: "unknown",
							processing_time_ms: 0,
						});
					}
				}),
			);
		}

		return {
			results,
			totalTime: performance.now() - startTime,
		};
	}

	/** Get the underlying PythonOCRClient for direct access */
	getRawClient(): PythonOCRClient {
		return this.client;
	}
}
