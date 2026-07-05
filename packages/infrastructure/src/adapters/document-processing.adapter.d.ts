import type {
	IDocumentSyncProcessor,
	IExpenseClassifier,
	IInvoiceOCRService,
	IUBLInvoiceParser,
} from "@drenyra/application";
import { processDocumentSync } from "../queues/document-processor.worker";

declare class UBLInvoiceParserAdapter implements IUBLInvoiceParser {
	private readonly parser;
	parseInvoice(
		xmlContent: string,
	): import("../xml/ubl-parser.types").ParsedInvoice;
}
declare class InvoiceOCRServiceAdapter implements IInvoiceOCRService {
	extractInvoiceData(options: {
		imageUrl?: string;
		pdfUrl?: string;
	}): Promise<import("@drenyra/ai/ai").OCRResponse>;
}
declare class ExpenseClassifierAdapter implements IExpenseClassifier {
	classifyExpense(input: {
		itemDescription: string;
		amount: number;
		businessType?: string;
		providerName?: string;
		category?: string;
	}): Promise<import("@drenyra/ai/ai").ClassificationResult | null>;
	quickClassify(description: string): {
		accountCode: string;
		accountName: string;
	};
}
declare class DocumentSyncProcessorAdapter implements IDocumentSyncProcessor {
	processDocumentSync(
		payload: Parameters<typeof processDocumentSync>[0],
	): Promise<import("../queues/document-processor.queue").DocumentJobResult>;
}
export declare const ublInvoiceParserAdapter: UBLInvoiceParserAdapter;
export declare const invoiceOCRServiceAdapter: InvoiceOCRServiceAdapter;
export declare const expenseClassifierAdapter: ExpenseClassifierAdapter;
export declare const documentSyncProcessorAdapter: DocumentSyncProcessorAdapter;
//# sourceMappingURL=document-processing.adapter.d.ts.map
