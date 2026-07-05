/**
 * Multi-Provider LLM Gateway - Public API
 *
 * @module @drenyra/ai/gateway
 */

// Budget enforcement
export {
	type BudgetCheckResult,
	BudgetEnforcer,
	type BudgetLimits,
	type BudgetStore,
	budgetEnforcer,
	createRepositoryBudgetStore,
	InMemoryBudgetStore,
} from "./budget-enforcer";
export {
	type CostAggregation,
	type CostCalculation,
	CostTracker,
	costTracker,
} from "./cost-tracker";
export {
	RateLimiter,
	type RateLimiterConfig,
	rateLimiter,
} from "./rate-limiter";
// Schemas (validation - types already defined in types.ts)
export {
	// Credential schemas
	addProviderCredentialsSchema,
	authenticatedChatCompletionRequestSchema,
	chatCompletionChoiceSchema,
	// Request schemas
	chatCompletionRequestSchema,
	// Response schemas
	chatCompletionResponseSchema,
	chatCompletionUsageSchema,
	chatMessageResponseSchema,
	chatMessageSchema,
	chatToolSchema,
	// Error schemas
	gatewayErrorSchema,
	llmProviderSchema,
	providerCredentialsResponseSchema,
	// Rate limit schemas
	rateLimitConfigSchema,
	rateLimitStatusSchema,
	toolChoiceSchema,
	updateProviderCredentialsSchema,
	validationErrorSchema,
} from "./schemas";
// SDK
export {
	assistantMessage,
	ChatRequestBuilder,
	createDirectGatewaySDK,
	createHTTPGatewaySDK,
	createLLMGatewaySDK,
	createMessage,
	extractStreamText,
	extractText,
	isLLMGatewayError,
	LLMGatewaySDK,
	type LLMGatewaySDKConfig,
	systemMessage,
	toolMessage,
	userMessage,
} from "./sdk";
// Services
export {
	type LLMGatewayConfig,
	LLMGatewayService,
	llmGateway,
} from "./service";
// Tracing
export {
	type LLMGatewaySpanAttributes,
	LLMGatewayTracer,
	type LLMSpan,
	llmGatewayTracer,
} from "./tracing";
// Types first (main interfaces)
export * from "./types";
