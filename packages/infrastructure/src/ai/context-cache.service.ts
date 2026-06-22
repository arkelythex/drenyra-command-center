/**
 * Gemini Context Cache Service
 *
 * Manages Gemini Context Caching for PCGE and SUNAT regulations.
 * This reduces latency and costs by pre-caching static domain knowledge.
 *
 * @description Uses Gemini's Context Caching API to store the PCGE
 * context, which doesn't change frequently, for faster inference.
 *
 * @since 2026 Gemini Brain Standard
 */

import { loggers } from "../logger";
import { GEMINI_SYSTEM_INSTRUCTION } from "./context/pcge-context";

// ============================================
// TYPES
// ============================================

/**
 * CacheConfig interface.
 *
 * @example
 * ```ts
 * const value: CacheConfig = {} as CacheConfig;
 * console.log(value);
 * ```
 */
export interface CacheConfig {
	/** Cache TTL in seconds (default: 3600 = 1 hour) */
	ttlSeconds?: number;
	/** Display name for the cache */
	displayName?: string;
}

/**
 * CachedContext interface.
 *
 * @example
 * ```ts
 * const value: CachedContext = {} as CachedContext;
 * console.log(value);
 * ```
 */
export interface CachedContext {
	id: string;
	name: string;
	displayName: string;
	createTime: string;
	expireTime: string;
	ttl: string;
}

// ============================================
// SERVICE
// ============================================

/**
 * Context Cache Service for Gemini
 *
 * Note: Context Caching is available in Gemini 1.5 Pro and newer.
 * Updated December 2025: Gemini 3 also supports context caching.
 * It requires a paid API tier.
 * @example
 * ```ts
 * const value = new ContextCacheService();
 * console.log(value);
 * ```
 */

export class ContextCacheService {
	private apiKey: string;
	private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
	private cachedContextId: string | null = null;

	constructor() {
		const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
		if (!key) {
			throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
		}
		this.apiKey = key;
	}

	/**
	 * Create or refresh the PCGE context cache
	 */
	async createPCGECache(config: CacheConfig = {}): Promise<CachedContext> {
		const { ttlSeconds = 3600, displayName = "Arkelythex PCGE Context" } = config;

		// Using gemini-3-pro for context caching (December 2025)
		const requestBody = {
			model: "models/gemini-3-pro",
			displayName,
			systemInstruction: {
				parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }],
			},
			ttl: `${ttlSeconds}s`,
		};

		try {
			const response = await fetch(
				`${this.baseUrl}/cachedContents?key=${this.apiKey}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(requestBody),
				},
			);

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Failed to create context cache: ${error}`);
			}

			const result = (await response.json()) as CachedContext;
			this.cachedContextId = result.name;

			loggers.ai.info("Created PCGE cache", { cacheName: result.name });
			return result;
		} catch (error) {
			loggers.ai.error("Error creating cache", { error });
			throw error;
		}
	}

	/**
	 * Get the cached context ID (if available)
	 */
	getCachedContextId(): string | null {
		return this.cachedContextId;
	}

	/**
	 * List all cached contexts
	 */
	async listCaches(): Promise<CachedContext[]> {
		try {
			const response = await fetch(
				`${this.baseUrl}/cachedContents?key=${this.apiKey}`,
			);

			if (!response.ok) {
				throw new Error("Failed to list caches");
			}

			const result = (await response.json()) as {
				cachedContents?: CachedContext[];
			};
			return result.cachedContents || [];
		} catch (error) {
			loggers.ai.error("Error listing caches", { error });
			return [];
		}
	}

	/**
	 * Delete a cached context
	 */
	async deleteCache(cacheName: string): Promise<boolean> {
		try {
			const response = await fetch(
				`${this.baseUrl}/${cacheName}?key=${this.apiKey}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				throw new Error("Failed to delete cache");
			}

			if (this.cachedContextId === cacheName) {
				this.cachedContextId = null;
			}

			loggers.ai.info("Deleted cache", { cacheName });
			return true;
		} catch (error) {
			loggers.ai.error("Error deleting cache", { error });
			return false;
		}
	}

	/**
	 * Get the system instruction for use without caching
	 * (fallback for free tier or when caching is unavailable)
	 */
	getSystemInstruction(): string {
		return GEMINI_SYSTEM_INSTRUCTION;
	}
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let contextCacheInstance: ContextCacheService | null = null;

/**
 * getContextCacheService operation.
 *
 * @returns Result of getContextCacheService.
 * @example
 * ```ts
 * const result = getContextCacheService();
 * console.log(result);
 * ```
 */
export function getContextCacheService(): ContextCacheService {
	if (!contextCacheInstance) {
		contextCacheInstance = new ContextCacheService();
	}
	return contextCacheInstance;
}
