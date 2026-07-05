/**
 * Banking Feature Module
 * Exports all public APIs for the banking bounded context
 */

export { bankingRoutes } from "./api/banking.routes";
export { AccountService } from "./application/services/account.service";
export { BankingApplicationService } from "./application/services/banking.application-service";
export { SummaryService } from "./application/services/summary.service";
export { TransactionService } from "./application/services/transaction.service";
export type {
	BankAccountRecord,
	BankTransactionRecord,
} from "./infrastructure/banking.repository";
export {
	BankingRepository,
	bankingRepository,
} from "./infrastructure/banking.repository";
