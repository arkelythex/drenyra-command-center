/**
 * Barrel export for all mock factories.
 */
export {
	createSunatMock,
	sunatSuccess,
	sunatRejection,
	sunatPending,
	sunatError,
	sunatTimeout,
	sunatObservacion,
	sunatHardRejection,
	rucValidationSuccess,
	rucValidationFailure,
} from "./sunat-api.mock";
export type { SunatResponse } from "./types";

export {
	createPrometeoMock,
	prometeoSuccess,
	prometeoFailure,
	prometeoError,
	prometeoUnauthorized,
	prometeoRateLimited,
} from "./prometeo.mock";
export type { PrometeoResponse } from "./types";

export {
	createLLMProviderMock,
	llmSuccess,
	llmFailure,
	llmRateLimited,
	llmDocumentExtraction,
	llmInvoiceClassification,
	llmStructuredOutput,
	llmExtractionResponse,
	llmClassificationResponse,
} from "./llm-provider.mock";
export type { LLMResponse } from "./types";

export {
	createDatabaseMock,
	createTransactionMock,
	type MockDatabase,
} from "./database.mock";

export {
	createEmailMock,
	emailSuccess,
	emailFailure,
	emailQueued,
} from "./email.mock";
export type { EmailResponse } from "./types";

export {
	createPaymentGatewayMock,
	paymentSuccess,
	paymentFailure,
	paymentPending,
} from "./payment-gateway.mock";
export type { PaymentResponse } from "./payment-gateway.mock";

export type { MockFactory } from "./types";
