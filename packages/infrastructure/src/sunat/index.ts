/**
 * SUNAT Infrastructure Module
 *
 * Exports all SUNAT-related services:
 * - SunatApiClient: HTTP client with OAuth 2.0
 * - SunatXmlParser: UBL 2.1 XML parser
 * - SunatPleGenerator: PLE (Libros Electrónicos) generator
 * - SunatSireService: SIRE synchronization service
 *
 * ⚠️ WARNING: SUNAT does NOT have a test environment.
 * All API requests go directly to PRODUCTION.
 */

// Shadow SUNAT Protocol (Pre-Audit AI)
export { ShadowSunatEngine, shadowSunatEngine } from "./ShadowSunatEngine";
export {
	generateRecommendations,
	getSectorBenchmark,
	SECTOR_BENCHMARKS,
	SUNAT_RISK_RULES,
} from "./ShadowSunatRules";
export type {
	RucInfo,
	SireDownloadResponse,
	SireTicketRequest,
	SireTicketResponse,
	SunatApiResponse,
	SunatCredentials,
	SunatToken,
} from "./SunatApiClient";
export { createSunatClient, SunatApiClient } from "./SunatApiClient";
export type {
	PleBookType,
	PleCompraRecord,
	PleConfig,
	PleDiarioRecord,
	PleGenerationResult,
	PleVentaRecord,
} from "./SunatPleGenerator";
export { createPleGenerator, SunatPleGenerator } from "./SunatPleGenerator";
export type {
	SireDiscrepancy,
	SireRecord,
	SireRegisterType,
	SireSyncRequest,
	SireSyncResult,
	SireSyncStatus,
} from "./SunatSireService";
export { createSireService, SunatSireService } from "./SunatSireService";
export type {
	ParseResult,
	UblInvoice,
	UblInvoiceItem,
} from "./SunatXmlParser";
export { createXmlParser, SunatXmlParser } from "./SunatXmlParser";
