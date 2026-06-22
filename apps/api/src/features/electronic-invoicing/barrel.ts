/**
 * Electronic Invoicing feature barrel export.
 * Re-exports all public types, services, and the facade for backward compatibility.
 */

// Facade (backward compatibility)
export { ElectronicInvoicingService } from "../../services/electronic-invoicing.service";
export { CdrProcessorService } from "./application/services/cdr-processor.service";
export { CpeLifecycleService } from "./application/services/cpe-lifecycle.service";
export { DataConsistencyService } from "./application/services/data-consistency.service";
// Application services
export { XmlParserService } from "./application/services/xml-parser.service";
// Domain types
export type {
	CdrWebhookPayload,
	CdrWebhookResult,
	ComplianceMetrics,
	CpeLifecycleSnapshot,
	ElectronicInvoiceData,
	ElectronicInvoiceResult,
	ElectronicInvoicingTrailEvent,
	RunbookReference,
	TransactionConsistencyRecord,
	ValidatedXmlInvoiceData,
} from "./domain/cpe.types";
// Feature module (Elysia routes)
export { electronicInvoicingModule } from "./index";
// Infrastructure
export { CpeRepository } from "./infrastructure/cpe.repository";
