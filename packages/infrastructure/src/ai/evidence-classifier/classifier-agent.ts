import type { ClassificationRequest, ClassificationResult } from "./types";

const PYTHON_OCR_URL =
	process.env.PYTHON_OCR_URL ?? "http://localhost:8002/api/v1/ocr/classify";
const CLASSIFIER_TIMEOUT = parseInt(
	process.env.CLASSIFIER_TIMEOUT ?? "30000",
	10,
);

export class EvidenceClassifierAgent {
	private readonly baseUrl: string;
	private readonly timeout: number;

	constructor(baseUrl?: string, timeout?: number) {
		this.baseUrl = baseUrl ?? PYTHON_OCR_URL;
		this.timeout = timeout ?? CLASSIFIER_TIMEOUT;
	}

	async classify(
		request: ClassificationRequest,
	): Promise<ClassificationResult> {
		const start = performance.now();

		const response = await fetch(this.baseUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				evidence_id: request.evidenceId,
				filename: request.filename,
				mime_type: request.mimeType,
				size_bytes: request.sizeBytes,
				content_hash: request.contentHash,
				metadata: request.metadata ?? {},
			}),
			signal: AbortSignal.timeout(this.timeout),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`[EvidenceClassifier] Classification failed: ${response.status} - ${errorText}`,
			);
		}

		const data = (await response.json()) as {
			evidence_type: string;
			confidence: number;
			labels: string[];
			summary: string;
			extracted_fields?: Record<string, unknown>;
		};

		return {
			evidenceType: data.evidence_type,
			confidence: data.confidence,
			labels: data.labels,
			summary: data.summary,
			extractedFields: data.extracted_fields,
			processingTimeMs: Math.round(performance.now() - start),
		};
	}

	async isHealthy(): Promise<boolean> {
		try {
			const healthUrl = this.baseUrl.replace(/\/classify$/, "/health");
			const response = await fetch(healthUrl, {
				signal: AbortSignal.timeout(5000),
			});
			return response.ok;
		} catch {
			return false;
		}
	}
}
