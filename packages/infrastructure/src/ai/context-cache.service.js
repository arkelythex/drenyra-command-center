import { loggers } from "../logger";
import { GEMINI_SYSTEM_INSTRUCTION } from "./context/pcge-context";
export class ContextCacheService {
    apiKey;
    baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    cachedContextId = null;
    constructor() {
        const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!key) {
            throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        }
        this.apiKey = key;
    }
    async createPCGECache(config = {}) {
        const { ttlSeconds = 3600, displayName = "Arkelythex PCGE Context" } = config;
        const requestBody = {
            model: "models/gemini-3-pro",
            displayName,
            systemInstruction: {
                parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }],
            },
            ttl: `${ttlSeconds}s`,
        };
        try {
            const response = await fetch(`${this.baseUrl}/cachedContents?key=${this.apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to create context cache: ${error}`);
            }
            const result = (await response.json());
            this.cachedContextId = result.name;
            loggers.ai.info("Created PCGE cache", { cacheName: result.name });
            return result;
        }
        catch (error) {
            loggers.ai.error("Error creating cache", { error });
            throw error;
        }
    }
    getCachedContextId() {
        return this.cachedContextId;
    }
    async listCaches() {
        try {
            const response = await fetch(`${this.baseUrl}/cachedContents?key=${this.apiKey}`);
            if (!response.ok) {
                throw new Error("Failed to list caches");
            }
            const result = (await response.json());
            return result.cachedContents || [];
        }
        catch (error) {
            loggers.ai.error("Error listing caches", { error });
            return [];
        }
    }
    async deleteCache(cacheName) {
        try {
            const response = await fetch(`${this.baseUrl}/${cacheName}?key=${this.apiKey}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete cache");
            }
            if (this.cachedContextId === cacheName) {
                this.cachedContextId = null;
            }
            loggers.ai.info("Deleted cache", { cacheName });
            return true;
        }
        catch (error) {
            loggers.ai.error("Error deleting cache", { error });
            return false;
        }
    }
    getSystemInstruction() {
        return GEMINI_SYSTEM_INSTRUCTION;
    }
}
let contextCacheInstance = null;
export function getContextCacheService() {
    if (!contextCacheInstance) {
        contextCacheInstance = new ContextCacheService();
    }
    return contextCacheInstance;
}
//# sourceMappingURL=context-cache.service.js.map