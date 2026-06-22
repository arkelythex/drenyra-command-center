import { PPOcrV6Client } from "./ppocr-v6";
import type { InvoiceData } from "./types";

export interface OcrAgentConfig {
	/** Priority order: 'ppocr-v6-first' | 'llm-only' */
	strategy: "ppocr-v6-first" | "llm-only";
	/** PP-OCRv6 confidence threshold for auto-escalation (0 = never escalate) */
	escalationThreshold: number;
	/** Max retries for PP-OCRv6 before falling back */
	maxRetries: number;
}

const DEFAULT_CONFIG: OcrAgentConfig = {
	strategy: "ppocr-v6-first",
	escalationThreshold: 0.4,
	maxRetries: 1,
};

export class OcrAgentRouter {
	private ppocr: PPOcrV6Client;
	private config: OcrAgentConfig;

	constructor(ppocrClient?: PPOcrV6Client, config?: Partial<OcrAgentConfig>) {
		this.ppocr = ppocrClient ?? new PPOcrV6Client();
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Route OCR request through the optimal pipeline.
	 * PP-OCRv6 first → if confidence too low → flag for LLM escalation.
	 */
	async extractInvoiceWithRouting(
		imageBuffer: Uint8Array | ArrayBuffer,
	): Promise<{
		data: InvoiceData;
		source: "ppocr-v6" | "llm";
		needsEscalation: boolean;
	}> {
		const { result } = await this.ppocr.extractInvoice(imageBuffer);

		const needsEscalation =
			result.overall_confidence < this.config.escalationThreshold;

		return {
			data: result,
			source: "ppocr-v6",
			needsEscalation,
		};
	}

	/** Check if the PP-OCRv6 service is available */
	async isServiceAvailable(): Promise<boolean> {
		try {
			return await this.ppocr.isHealthy();
		} catch {
			return false;
		}
	}

	/** Update routing config at runtime */
	updateConfig(config: Partial<OcrAgentConfig>): void {
		this.config = { ...this.config, ...config };
	}
}
