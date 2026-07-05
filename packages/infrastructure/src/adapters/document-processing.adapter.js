import { classifyExpense, quickClassify } from "../ai/accounting-classifier";
import { extractInvoiceData } from "../ai/ocr";
import { processDocumentSync } from "../queues/document-processor.worker";
import { UBLParser } from "../xml/ubl-parser";

class UBLInvoiceParserAdapter {
	parser = new UBLParser();
	parseInvoice(xmlContent) {
		return this.parser.parseInvoice(xmlContent);
	}
}
class InvoiceOCRServiceAdapter {
	async extractInvoiceData(options) {
		return extractInvoiceData(options);
	}
}
class ExpenseClassifierAdapter {
	async classifyExpense(input) {
		return classifyExpense(input);
	}
	quickClassify(description) {
		return quickClassify(description);
	}
}
class DocumentSyncProcessorAdapter {
	async processDocumentSync(payload) {
		return processDocumentSync(payload);
	}
}
export const ublInvoiceParserAdapter = new UBLInvoiceParserAdapter();
export const invoiceOCRServiceAdapter = new InvoiceOCRServiceAdapter();
export const expenseClassifierAdapter = new ExpenseClassifierAdapter();
export const documentSyncProcessorAdapter = new DocumentSyncProcessorAdapter();
//# sourceMappingURL=document-processing.adapter.js.map
