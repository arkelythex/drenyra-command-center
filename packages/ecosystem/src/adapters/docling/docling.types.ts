/**
 * Docling-specific types for the Drenyra ecosystem connector.
 *
 * Docling (IBM) is used for AI-powered document understanding and extraction
 * of fiscal documents (invoices, receipts, bank statements).
 */

export type DoclingOperation =
	| {
			type: "document.extract";
			document: DocumentInput;
			options?: ExtractionOptions;
	  }
	| { type: "document.classify"; text: string }
	| { type: "health" };

export interface DocumentInput {
	/** Base64-encoded document content */
	content: string;
	/** MIME type: application/pdf, image/jpeg, image/png */
	mimeType: string;
	/** Original filename */
	filename?: string;
}

export interface ExtractionOptions {
	/** Extract tables separately */
	extractTables?: boolean;
	/** Extract images */
	extractImages?: boolean;
	/** Language hint (default: "spa") */
	language?: string;
}

export interface DoclingExtractionResult {
	/** Full markdown-style text */
	markdown: string;
	/** Tables extracted (if requested) */
	tables?: Array<{
		caption?: string;
		data: string[][]; // Rows of cell values
	}>;
	/** Processing time */
	processingTimeMs: number;
}

export interface DoclingClassificationResult {
	documentType: string;
	confidence: number;
	suggestedAction: string;
}

export interface DoclingApiError {
	error: string;
	detail?: string;
}
