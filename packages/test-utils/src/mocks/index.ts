/**
 * Barrel export for all mock factories.
 */

export {
	createDatabaseMock,
	createTransactionMock,
	type MockDatabase,
} from "./database.mock";
export {
	createEmailMock,
	emailFailure,
	emailQueued,
	emailSuccess,
} from "./email.mock";
export {
	createLLMProviderMock,
	llmClassificationResponse,
	llmDocumentExtraction,
	llmExtractionResponse,
	llmFailure,
	llmInvoiceClassification,
	llmRateLimited,
	llmStructuredOutput,
	llmSuccess,
} from "./llm-provider.mock";
export type { PaymentResponse } from "./payment-gateway.mock";
export {
	createPaymentGatewayMock,
	paymentFailure,
	paymentPending,
	paymentSuccess,
} from "./payment-gateway.mock";
export {
	createPrometeoMock,
	prometeoError,
	prometeoFailure,
	prometeoRateLimited,
	prometeoSuccess,
	prometeoUnauthorized,
} from "./prometeo.mock";
export {
	createSunatMock,
	rucValidationFailure,
	rucValidationSuccess,
	sunatError,
	sunatHardRejection,
	sunatObservacion,
	sunatPending,
	sunatRejection,
	sunatSuccess,
	sunatTimeout,
} from "./sunat-api.mock";
export type {
	EmailResponse,
	LLMResponse,
	MockFactory,
	PrometeoResponse,
	SunatResponse,
} from "./types";
