/**
 * AI Services - Export all AI-related functionality
 *
 * Unified export for AI models, services, and utilities
 */

export type { ModelTask } from "./models";
// Models
export {
	getModelForTask,
	MODEL_STRATEGY,
	modelFlash,
	modelOpus,
	modelReasoning,
} from "./models";
export type { OCROptions, OCRResponse, OcrPipelineConfig } from "./ocr";
// OCR Service
export {
	batchExtractInvoices,
	extractFromFile,
	extractInvoiceData,
	OcrPipeline,
} from "./ocr";
// Prompts
export {
	ANTIGRAVITY_PROMPT,
	getAntigravityPrompt,
	getOCRPrompt,
	getValidationPrompt,
	OCR_EXTRACTION_PROMPT,
	PERUVIAN_ACCOUNTING_CONTEXT,
	VALIDATION_PROMPT,
} from "./prompts";
// Router
export { aiRouter, logAIOperation } from "./router";
export type {
	ErrorSeverity,
	ValidationError,
	ValidationResponse,
} from "./validation.service";
// Validation Service
export {
	applyAutoCorrections,
	batchValidateInvoices,
	quickValidate,
	validateInvoiceWithAI,
} from "./validation.service";

// ============================================
// 2026 GEMINI BRAIN STANDARD
// ============================================

// PCGE Context (for Context Caching)
export {
	EXPENSE_CLASSIFICATION_CONTEXT,
	FUNCTION_CALLING_INSTRUCTIONS,
	GEMINI_SYSTEM_INSTRUCTION,
	PCGE_FULL_CONTEXT,
} from "./context";
export type { CacheConfig, CachedContext } from "./context-cache.service";
// Context Cache Service
export {
	ContextCacheService,
	getContextCacheService,
} from "./context-cache.service";
export type { GeminiToolName } from "./gemini-tools";
// Gemini Function Calling Tools
export {
	CalcularDetraccionSchema,
	ConsultarRucSchema,
	CrearAsientoSchema,
	calcularDetraccion,
	consultarRucSunat,
	crearAsiento,
	executeGeminiTool,
	geminiToolDefinitions,
	ObtenerTipoCambioSchema,
	obtenerTipoCambio,
	RegistrarGastoVozSchema,
	registrarGastoVoz,
	VerificarComprobanteSchema,
	verificarComprobante,
} from "./gemini-tools";

// ============================================
// OPENROUTER STREAMING + TOOL CALLING (2026)
// ============================================

// Accounting Classifier
export type {
	ClassificationInput,
	ClassificationResult,
} from "./accounting-classifier";
export {
	ClassificationSchema,
	classifyExpense,
	quickClassify,
	suggestPurchaseEntry,
} from "./accounting-classifier";
// OpenRouter Model Tiers (Future-Proof)
export type { OpenRouterModelTier } from "./model-registry";
export {
	getOpenRouterFallbackChain,
	getOpenRouterModelForTier,
	getOpenRouterTierConfig,
	OPENROUTER_MODEL_TIERS,
} from "./model-registry";
export { AnthropicAdapter } from "./model-router/anthropic-adapter";
export type { FallbackConfig } from "./model-router/fallback-executor";
export { FallbackExecutor } from "./model-router/fallback-executor";
export { OpenAIAdapter } from "./model-router/openai-adapter";
export { OpenRouterAdapter } from "./model-router/openrouter-adapter";
export type {
	ProviderAdapter,
	ProviderAdapterFactory,
	ProviderHealth,
	ProviderRequest,
	ProviderResponse,
} from "./model-router/provider-adapter.types";
export type {
	QualityGate,
	QualityGateResult,
} from "./model-router/quality-gates";
export {
	CostCapEnforcer,
	ReputationGate,
	ResponseValidator,
	runQualityGates,
} from "./model-router/quality-gates";
// Model Router
export { ModelRegistryService } from "./model-router/registry";
export type { RouterOptions } from "./model-router/router";
export { AdaptiveRouter } from "./model-router/router";
export type {
	CapabilityScore,
	RouterConfig,
	RoutingRequest,
} from "./model-router/types";
// Tool Bridge (Zod → OpenRouter)
export type {
	PermissionCheckFn,
	PermissionEffect,
	ToolApprovalRequest,
	ToolStreamEvent,
} from "./tool-bridge";
export {
	getOpenRouterTools,
	streamWithToolExecution,
} from "./tool-bridge";
