import type { ExtractedData } from "@drenyra/domain/entities/Document";

/**
 * ProcessDocumentInput interface.
 *
 * @example
 * ```ts
 * const value: ProcessDocumentInput = {} as ProcessDocumentInput;
 * console.log(value);
 * ```
 */
export interface ProcessDocumentInput {
	companyId: string;
	documentId: string;
	fileUrl: string;
	fileType: "IMAGE" | "PDF" | "XML";
}

/**
 * ProcessDocumentResult interface.
 *
 * @example
 * ```ts
 * const value: ProcessDocumentResult = {} as ProcessDocumentResult;
 * console.log(value);
 * ```
 */
export interface ProcessDocumentResult {
	success: boolean;
	documentId: string;
	source: "XML" | "OCR";
	evidenceBundle?: {
		scope: {
			companyId: string;
			documentId: string;
		};
		evidenceType: "document_extraction";
	};
	deterministicValidationRequest?: {
		scope: {
			companyId: string;
			documentId: string;
		};
		payload: {
			ruc?: string;
			totalAmount?: number;
			igvAmount?: number;
		};
	};
	extractedData?: ExtractedData & {
		suggestedAccount?: string;
		suggestedAccountName?: string;
		classificationConfidence?: number;
	};
	processingTimeMs: number;
	error?: string;
}
