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
export type { OCROptions, OCRResponse } from "./ocr";
// OCR Service
export {
	batchExtractInvoices,
	extractFromFile,
	extractInvoiceData,
	OcrPipeline,
} from "./ocr";
export type { OcrPipelineConfig } from "./ocr";
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

// OpenRouter Model Tiers (Future-Proof)
export type { OpenRouterModelTier } from "./model-registry";
export {
	OPENROUTER_MODEL_TIERS,
	getOpenRouterModelForTier,
	getOpenRouterFallbackChain,
	getOpenRouterTierConfig,
} from "./model-registry";

// Tool Bridge (Zod → OpenRouter)
export type {
  ToolStreamEvent,
  ToolApprovalRequest,
  PermissionEffect,
  PermissionCheckFn,
} from "./tool-bridge";
export {
	getOpenRouterTools,
	streamWithToolExecution,
} from "./tool-bridge";

// Accounting Classifier
export type { ClassificationInput, ClassificationResult } from "./accounting-classifier";
export {
	ClassificationSchema,
	classifyExpense,
	suggestPurchaseEntry,
	quickClassify,
} from "./accounting-classifier";
