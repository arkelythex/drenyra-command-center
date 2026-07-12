export interface OCROptions {
	imageUrl?: string;
	imageBuffer?: Buffer;
	pdfUrl?: string;
	xmlContent?: string;
	model?: "gemini-flash" | "gemini-pro";
}
export interface InvoiceData {
	series?: string;
	number?: number;
	issueDate?: Date;
	clientName?: string;
	clientRUC?: string;
	clientDNI?: string;
	baseAmount?: number;
	igvAmount?: number;
	totalAmount?: number;
	currency?: "PEN" | "USD";
	items?: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
	}>;
}
export interface OcrResult {
	success: boolean;
	data?: Partial<InvoiceData>;
	error?: string;
	cost?: number;
	duration?: number;
}
export interface IOcrService {
	extract(options: OCROptions): Promise<OcrResult>;
}
//# sourceMappingURL=IOcrService.d.ts.map
