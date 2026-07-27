export { ReportsService } from "./_internal/default-instance";
export { ReportingService } from "./application/services/reporting.service";
export {
	GetBalanceSheetQuery,
	GetCashFlowQuery,
	GetProfitLossQuery,
	GetSalesByCustomerQuery,
} from "./queries";
export type {
	BalanceSheetReport,
	CashFlowReport,
	ProfitLossReport,
	ReportsAsOfDateQuery,
	ReportsDateRangeQuery,
	SalesByCustomerRow,
} from "./reports.schemas";
export { reportsModule } from "./routes";

// New exports
export { v1ReportsModule } from "./v1/routes";
export { legacyReportsModule } from "./legacy/routes";
export { pleModule } from "./v1/routes/ple";
export { PleGeneratorService } from "./application/services/ple-generator.service";
export { LedgerQueryFactory } from "./infrastructure/ledger-query.facade";
export { isFeatureEnabled, requireFeatureFlag } from "./infrastructure/feature-flags";
export { reportError, ErrorCodes } from "./_internal/error-shapes";
export { injectVersionHeader } from "./_internal/api-version-header";
export type { LedgerQuery, LedgerEntry, AccountBalance } from "./domain/ledger-query.types";
export type { PleBookType, PleGenerationResult, PleGenerationStatus } from "./domain/ple.types";
