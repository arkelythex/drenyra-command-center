/**
 * Multi-Provider LLM Gateway - Zod Schemas
 *
 * Input validation schemas for the unified LLM gateway API.
 * Uses Zod 4 patterns (top-level validators, error param).
 *
 * @module @arkelythex/ai/gateway
 */

import { z } from "zod";

// ============================================
// Enums as Schemas
// ============================================

/**
 * Supported LLM providers schema.
 */
export const llmProviderSchema = z.enum(
	["anthropic", "openai", "google", "grok", "openrouter"],
	{ error: "Invalid LLM provider" },
);

/**
 * Request priority schema.
 */
export const requestPrioritySchema = z.enum(["low", "normal", "high"], {
	error: "Invalid priority",
});

/**
 * Message role schema.
 */
export const messageRoleSchema = z.enum(
	["system", "user", "assistant", "tool"],
	{
		error: "Invalid message role",
	},
);

// ============================================
// Message Schemas
// ============================================

/**
 * Tool function definition schema.
 */
export const chatToolFunctionSchema = z.object({
	name: z.string().min(1, { error: "Function name is required" }),
	description: z.string().optional(),
	parameters: z.record(z.string(), z.unknown()), // JSON Schema
});

/**
 * Tool definition schema.
 */
export const chatToolSchema = z.object({
	type: z.literal("function"),
	function: chatToolFunctionSchema,
});

/**
 * Tool choice schema.
 */
export const toolChoiceSchema = z.union([
	z.literal("none"),
	z.literal("auto"),
	z.object({
		type: z.literal("function"),
		function: z.object({
			name: z.string(),
		}),
	}),
]);

/**
 * Chat message schema.
 */
export const chatMessageSchema = z.object({
	role: messageRoleSchema,
	content: z.string().min(1, { error: "Message content is required" }),
	name: z.string().optional(),
	toolCallId: z.string().optional(),
});

// ============================================
// Request Schemas
// ============================================

/**
 * Basic chat completion request schema.
 */
export const chatCompletionRequestSchema = z.object({
	// Model (required)
	model: z.string().min(1, { error: "Model is required" }),

	// Provider override (optional)
	provider: llmProviderSchema.optional(),

	// Messages (required, at least one)
	messages: z
		.array(chatMessageSchema)
		.min(1, { error: "At least one message is required" }),

	// Optional parameters
	temperature: z.number().min(0).max(2).optional(),
	topP: z.number().min(0).max(1).optional(),
	maxTokens: z.number().int().positive().optional(),
	stop: z.union([z.string(), z.array(z.string())]).optional(),
	seed: z.number().int().optional(),

	// Streaming
	stream: z.boolean().optional(),

	// Tools
	tools: z.array(chatToolSchema).optional(),
	toolChoice: toolChoiceSchema.optional(),

	// Response format
	responseFormat: z
		.object({
			type: z.literal("json_object"),
		})
		.optional(),

	// Gateway-specific
	priority: requestPrioritySchema.optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Authenticated chat completion request (internal use).
 */
export const authenticatedChatCompletionRequestSchema =
	chatCompletionRequestSchema.extend({
		organizationId: z
			.number()
			.int()
			.min(1, { error: "Organization ID is required" }),
		userId: z.string().min(1, { error: "User ID is required" }),
	});

// ============================================
// Response Schemas (for testing/validation)
// ============================================

/**
 * Usage statistics schema.
 */
export const chatCompletionUsageSchema = z.object({
	promptTokens: z.number().int().nonnegative(),
	completionTokens: z.number().int().nonnegative(),
	totalTokens: z.number().int().nonnegative(),
});

/**
 * Chat message response schema.
 */
export const chatMessageResponseSchema = z.object({
	role: messageRoleSchema,
	content: z.string(),
	name: z.string().optional(),
	toolCallId: z.string().optional(),
});

/**
 * Chat completion choice schema.
 */
export const chatCompletionChoiceSchema = z.object({
	index: z.number().int().nonnegative(),
	message: chatMessageResponseSchema,
	finishReason: z
		.union([
			z.literal("stop"),
			z.literal("length"),
			z.literal("content_filter"),
			z.literal("tool_calls"),
			z.null(),
		])
		.optional(),
});

/**
 * Chat completion response schema.
 */
export const chatCompletionResponseSchema = z.object({
	id: z.string(),
	object: z.literal("chat.completion"),
	created: z.number().int(),
	model: z.string(),
	provider: llmProviderSchema,
	choices: z.array(chatCompletionChoiceSchema),
	usage: chatCompletionUsageSchema,
});

// ============================================
// Provider Credentials Schemas
// ============================================

/**
 * Add provider credentials request schema.
 */
export const addProviderCredentialsSchema = z.object({
	provider: llmProviderSchema,

	// API key (will be encrypted before storage)
	apiKey: z.string().min(1, { error: "API key is required" }),

	// Optional alias for display
	apiKeyAlias: z.string().max(50).optional(),

	// Configuration
	isDefault: z.boolean().optional(),

	// Rate limits (optional overrides)
	rateLimitRpm: z.number().int().positive().optional(),
	rateLimitRpd: z.number().int().positive().optional(),
});

/**
 * Update provider credentials request schema.
 */
export const updateProviderCredentialsSchema = z.object({
	apiKey: z.string().min(1).optional(),
	apiKeyAlias: z.string().max(50).optional(),
	isActive: z.boolean().optional(),
	isDefault: z.boolean().optional(),
	rateLimitRpm: z.number().int().positive().optional(),
	rateLimitRpd: z.number().int().positive().optional(),
});

/**
 * Provider credentials response schema (excludes sensitive data).
 */
export const providerCredentialsResponseSchema = z.object({
	id: z.number(),
	organizationId: z.number(),
	provider: llmProviderSchema,
	apiKeyAlias: z.string().optional(),
	isActive: z.boolean(),
	isDefault: z.boolean(),
	rateLimitRpm: z.number(),
	rateLimitRpd: z.number(),
	requestsToday: z.number(),
	lastRequestAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ============================================
// Rate Limiting Schemas
// ============================================

/**
 * Rate limit configuration schema.
 */
export const rateLimitConfigSchema = z.object({
	requestsPerMinute: z.number().int().positive().default(60),
	requestsPerDay: z.number().int().positive().default(10000),
});

/**
 * Rate limit status response schema.
 */
export const rateLimitStatusSchema = z.object({
	allowed: z.boolean(),
	remainingRpm: z.number().int(),
	resetRpmAt: z.date(),
	remainingRpd: z.number().int(),
	resetRpdAt: z.date(),
	retryAfter: z.number().int().optional(),
});

// ============================================
// Error Response Schemas
// ============================================

/**
 * Gateway error response schema.
 */
export const gatewayErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		provider: llmProviderSchema.optional(),
		details: z.record(z.string(), z.unknown()).optional(),
	}),
});

/**
 * Validation error response schema.
 */
export const validationErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.literal("VALIDATION_ERROR"),
		message: z.string(),
		issues: z.array(
			z.object({
				path: z.array(z.union([z.string(), z.number()])),
				message: z.string(),
			}),
		),
	}),
});

// ============================================
// Type Exports
// ============================================
// NOTE: Type exports are in types.ts to avoid duplication
// These are schema-only exports
// ============================================
