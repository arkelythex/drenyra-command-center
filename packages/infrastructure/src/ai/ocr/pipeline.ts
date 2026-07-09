/**
 * OCR Pipeline - Tiered OCR Routing
 *
 * Implements a two-tier OCR pipeline:
 * 1. Primary: PP-OCRv6 (fast, local, cost-effective)
 * 2. Fallback: Gemini 2.5 Flash (high accuracy, cloud)
 *
 * Falls back automatically when PP-OCRv6 is unavailable or confidence is low.
 */

import {
	OcrAgentRouter,
	PPOcrV6Client,
} from "@drenyra/infrastructure/services/python-ocr";
import { loggers } from "../../logger";
import type { OCRResult } from "../schemas/invoice";
import { extractInvoiceData } from "./service";
import type { OCROptions, OCRResponse } from "./types";

// ============================================
// Pipeline Configuration
// ============================================

export interface OcrPipelineConfig {
	/** Enable PP-OCRv6 as primary OCR (default: true) */
	enablePpOcrV6: boolean;
	/** Confidence threshold for PP-OCRv6 → Gemini fallback (0-1, default: 0.4) */
	fallbackThreshold: number;
	/** PP-OCRv6 model tier */
	modelTier: "ultra-light" | "light" | "server";
	/** Use GPU for PP-OCRv6 */
	useGpu: boolean;
	/** PP-OCRv6 service URL */
	serviceUrl: string;
}

const DEFAULT_CONFIG: OcrPipelineConfig = {
	enablePpOcrV6: true,
	fallbackThreshold: 0.4,
	modelTier: "light",
	useGpu: false,
	serviceUrl: "http://localhost:8001",
};

// ============================================
// Pipeline Class
// ============================================

/**
 * OcrPipeline class.
 *
 * @example
 * ```ts
 * const pipeline = new OcrPipeline();
 * const result = await pipeline.extractInvoice({ imageUrl: "data:image/jpeg;base64,..." });
 * console.log(result);
 * ```
 */
export class OcrPipeline {
	private config: OcrPipelineConfig;
	private ppocr: PPOcrV6Client | null = null;
	private router: OcrAgentRouter | null = null;

	constructor(config?: Partial<OcrPipelineConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Initialize PP-OCRv6 client if enabled.
	 * Separate from constructor so callers can lazy-init.
	 */
	private ensurePpOcr(): void {
		if (!this.ppocr && this.config.enablePpOcrV6) {
			this.ppocr = new PPOcrV6Client({
				baseUrl: this.config.serviceUrl,
				modelTier: this.config.modelTier,
				useGpu: this.config.useGpu,
				llmFallbackThreshold: this.config.fallbackThreshold,
			});
			this.router = new OcrAgentRouter(this.ppocr, {
				escalationThreshold: this.config.fallbackThreshold,
			});
		}
	}

	/**
	 * Extract invoice data — tries PP-OCRv6 first, falls back to Gemini if low confidence or unavailable.
	 * @param options - Input for options.
	 * @returns Result of extractInvoice.
	 * @example
	 * ```ts
	 * const result = await pipeline.extractInvoice({ imageUrl: "data:image/jpeg;base64,..." });
	 * console.log(result);
	 * ```
	 */
	async extractInvoice(options: OCROptions): Promise<OCRResponse> {
		this.ensurePpOcr();

		// Try PP-OCRv6 first if enabled
		if (this.ppocr && this.router) {
			try {
				const isAvailable = await this.router.isServiceAvailable();
				if (isAvailable) {
					return await this.extractWithPpOcr(options);
				}
				loggers.ai.info("PP-OCRv6 unavailable, falling back to Gemini", {
					serviceUrl: this.config.serviceUrl,
				});
			} catch (error) {
				loggers.ai.warn("PP-OCRv6 error, falling back to Gemini", { error });
			}
		}

		// Fallback: Gemini via existing service
		return this.extractWithGemini(options);
	}

	/**
	 * Extract using PP-OCRv6, escalating to Gemini when confidence is low.
	 */
	private async extractWithPpOcr(options: OCROptions): Promise<OCRResponse> {
		const { imageBuffer } = this.resolveImage(options);

		const {
			data,
			source: rawSource,
			needsEscalation,
		} = await this.router?.extractInvoiceWithRouting(imageBuffer);

		// Normalize source — router returns "llm" for escalation path, but our
		// OCRResponse distinguishes actual processing backends (ppocr-v6 vs gemini)
		const source = rawSource === "llm" ? "gemini" : rawSource;

		const ocrResponse: OCRResponse = {
			success: true,
			data: {
				series: data.serie_numero?.value?.split("-")[0] ?? null,
				number: data.serie_numero?.value?.split("-")[1] ?? null,
				issueDate: data.fecha_emision?.value ?? null,
				clientName: data.razon_social?.value ?? null,
				clientRuc: data.ruc?.value ?? null,
				base: data.subtotal?.value
					? Number.parseFloat(data.subtotal.value)
					: null,
				igv: data.igv?.value ? Number.parseFloat(data.igv.value) : null,
				total: data.total?.value ? Number.parseFloat(data.total.value) : null,
				currency:
					data.moneda?.value === "SOLES"
						? "PEN"
						: data.moneda?.value === "DOLARES"
							? "USD"
							: null,
				text: data.raw_text,
				confidence: data.overall_confidence,
				fields: {
					tipo_documento: data.tipo_documento?.value ?? null,
					fecha_vencimiento: data.fecha_vencimiento?.value ?? null,
					razon_social: data.razon_social?.value ?? null,
					ruc: data.ruc?.value ?? null,
				},
			} as unknown as OCRResult,
			source,
			needsReview: data.needs_review,
			warnings: data.warnings,
		};

		// If confidence is low, escalate to Gemini
		if (needsEscalation) {
			loggers.ai.info("PP-OCRv6 confidence low, escalating to Gemini", {
				confidence: data.overall_confidence,
			});
			return this.extractWithGemini(options);
		}

		return ocrResponse;
	}

	/**
	 * Extract using Gemini as fallback.
	 */
	private async extractWithGemini(options: OCROptions): Promise<OCRResponse> {
		const response = await extractInvoiceData(options);
		return {
			...response,
			source: "gemini",
		};
	}

	/**
	 * Resolve image source to a byte buffer.
	 */
	private resolveImage(options: OCROptions): { imageBuffer: Uint8Array } {
		if (options.imageUrl) {
			// Image URL is a base64 data URL — convert to buffer
			const base64 = options.imageUrl.replace(/^data:image\/\w+;base64,/, "");
			return {
				imageBuffer: Uint8Array.from(globalThis.atob(base64), (c) =>
					c.charCodeAt(0),
				),
			};
		}
		if (options.file) {
			return { imageBuffer: options.file };
		}
		throw new Error("No image source provided — need imageUrl or file");
	}

	/**
	 * Check if PP-OCRv6 service is healthy
	 * @returns Result of isPpOcrHealthy.
	 * @example
	 * ```ts
	 * const healthy = await pipeline.isPpOcrHealthy();
	 * console.log(healthy);
	 * ```
	 */
	async isPpOcrHealthy(): Promise<boolean> {
		this.ensurePpOcr();
		if (!this.ppocr) return false;
		return this.ppocr.isHealthy();
	}

	/**
	 * Update config at runtime
	 * @param config - Input for config.
	 * @example
	 * ```ts
	 * pipeline.updateConfig({ fallbackThreshold: 0.5 });
	 * ```
	 */
	updateConfig(config: Partial<OcrPipelineConfig>): void {
		this.config = { ...this.config, ...config };
	}
}
