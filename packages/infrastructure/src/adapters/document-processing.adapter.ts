import type {
	IDocumentSyncProcessor,
	IExpenseClassifier,
	IInvoiceOCRService,
	IUBLInvoiceParser,
} from "@drenyra/application";
import {
	classifyExpense,
	quickClassify,
} from "../ai/accounting-classifier.service";
import { extractInvoiceData } from "../ai/ocr.service";
import { processDocumentSync } from "../queues/document-processor.worker";
import { UBLParser } from "../xml/ubl-parser";

class UBLInvoiceParserAdapter implements IUBLInvoiceParser {
	private readonly parser = new UBLParser();

	parseInvoice(xmlContent: string) {
		return this.parser.parseInvoice(xmlContent);
	}
}

class InvoiceOCRServiceAdapter implements IInvoiceOCRService {
	async extractInvoiceData(options: { imageUrl?: string; pdfUrl?: string }) {
		return extractInvoiceData(options);
	}
}

class ExpenseClassifierAdapter implements IExpenseClassifier {
	async classifyExpense(input: {
		itemDescription: string;
		amount: number;
		businessType?: string;
		providerName?: string;
		category?: string;
	}) {
		return classifyExpense(input);
	}

	quickClassify(description: string) {
		return quickClassify(description);
	}
}

class DocumentSyncProcessorAdapter implements IDocumentSyncProcessor {
	async processDocumentSync(payload: Parameters<typeof processDocumentSync>[0]) {
		return processDocumentSync(payload);
	}
}

/**
 * ublInvoiceParserAdapter const.
 *
 * @example
 * ```ts
 * console.log(ublInvoiceParserAdapter);
 * ```
 */
export const ublInvoiceParserAdapter = new UBLInvoiceParserAdapter();
/**
 * invoiceOCRServiceAdapter const.
 *
 * @example
 * ```ts
 * console.log(invoiceOCRServiceAdapter);
 * ```
 */
export const invoiceOCRServiceAdapter = new InvoiceOCRServiceAdapter();
/**
 * expenseClassifierAdapter const.
 *
 * @example
 * ```ts
 * console.log(expenseClassifierAdapter);
 * ```
 */
export const expenseClassifierAdapter = new ExpenseClassifierAdapter();
/**
 * documentSyncProcessorAdapter const.
 *
 * @example
 * ```ts
 * console.log(documentSyncProcessorAdapter);
 * ```
 */
export const documentSyncProcessorAdapter =
	new DocumentSyncProcessorAdapter();
