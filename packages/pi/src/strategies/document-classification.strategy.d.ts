import type { Anomaly, AnomalyStrategy } from "./types";
export type DetectedDocType = "invoice" | "receipt" | "identity" | "contract" | "bank_statement" | "sunat_xml" | "unknown";
export type DetectedFormat = "IMAGE" | "XML" | "PDF" | "UNKNOWN";
export interface DocumentToClassify {
    id: string;
    filename?: string;
    text: string;
    declaredType?: DetectedDocType;
    serie?: string;
}
export interface ClassificationResult {
    documentId: string;
    detectedType: DetectedDocType;
    detectedFormat: DetectedFormat;
    sunatType?: string;
    confidence: number;
    completenessScore: number;
    missingFields: string[];
    classificationMethod: string;
}
export interface DocumentClassificationOptions {
    minConfidence?: number;
    checkFormat?: boolean;
    classifyByContent?: boolean;
    checkCompleteness?: boolean;
    checkTypeMismatch?: boolean;
}
export declare const DEFAULT_MIN_CONFIDENCE = 0.5;
export declare const MIN_UNREADABLE_CHARS = 20;
export declare const DOCUMENT_TYPE_KEYWORDS: Record<DetectedDocType, {
    keywords: string[];
    weight: number;
}[]>;
export declare const SUNAT_SERIES_PATTERNS: Record<string, string>;
export declare const REQUIRED_FIELDS: Record<DetectedDocType, string[]>;
export declare function classifyDocument(doc: DocumentToClassify, options?: DocumentClassificationOptions): {
    result: ClassificationResult;
    anomalies: Anomaly[];
};
export declare function classifyDocuments(documents: DocumentToClassify[], options?: DocumentClassificationOptions): {
    results: ClassificationResult[];
    anomalies: Anomaly[];
};
export declare function createDocumentClassificationStrategy(options?: DocumentClassificationOptions): AnomalyStrategy;
//# sourceMappingURL=document-classification.strategy.d.ts.map