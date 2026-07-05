import type { ExtractedData } from "@drenyra/domain/entities/Document";

/**
 * AI extraction service port for turning images/XML/PDF into structured {@link ExtractedData}.
 *
 * @example
 * ```ts
 * const extractor: IAIExtractionService = getAIExtractionService();
 * const data = await extractor.extractFromImage("https://example.com/invoice.png");
 * ```
 */
export interface IAIExtractionService {
	extractFromImage(imageUrl: string): Promise<ExtractedData>;
	extractFromXML(xmlContent: string): Promise<ExtractedData>;
	extractFromPDF(pdfUrl: string): Promise<ExtractedData>;
}

/**
 * Optional configuration for AI extraction.
 *
 * @example
 * ```ts
 * const opts: AIExtractionOptions = { model: "sonnet", confidenceThreshold: 0.85 };
 * ```
 */
export interface AIExtractionOptions {
	model?: "haiku" | "sonnet" | "opus";
	confidenceThreshold?: number;
}
