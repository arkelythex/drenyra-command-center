import { type OCROptions, type OCRResponse } from "./types";
export declare function extractInvoiceData(
	options: OCROptions,
): Promise<OCRResponse>;
export declare function batchExtractInvoices(
	documents: OCROptions[],
): Promise<OCRResponse[]>;
export declare function extractFromFile(
	file: File,
	organizationId?: number,
): Promise<OCRResponse>;
//# sourceMappingURL=service.d.ts.map
