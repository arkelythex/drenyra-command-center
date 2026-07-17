class RateLimiter {
    requestTimestamps = [];
    tokenCount = 0;
    tokenResetTime = Date.now();
    maxRequests;
    maxTokens;
    windowMs = 60_000;
    constructor(config) {
        this.maxRequests = config.maxRequestsPerMinute;
        this.maxTokens = config.maxTokensPerMinute;
    }
    allow(tokenCount) {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter((ts) => now - ts < this.windowMs);
        if (now - this.tokenResetTime >= this.windowMs) {
            this.tokenCount = 0;
            this.tokenResetTime = now;
        }
        if (this.requestTimestamps.length >= this.maxRequests) {
            return false;
        }
        if (this.tokenCount + tokenCount > this.maxTokens) {
            return false;
        }
        this.requestTimestamps.push(now);
        this.tokenCount += tokenCount;
        return true;
    }
}
export class AIGateway {
    modelRegistry;
    providers;
    rateLimiter;
    isShutdown = false;
    totalRequests = 0;
    totalTokens = 0;
    totalCost = 0;
    failoverCount = 0;
    rateLimitedCount = 0;
    constructor(options) {
        this.modelRegistry = options.modelRegistry;
        this.providers = new Map(Object.entries(options.providers));
        if (options.config.rateLimits) {
            this.rateLimiter = new RateLimiter(options.config.rateLimits);
        }
    }
    async execute(request) {
        if (this.isShutdown) {
            throw new Error("AIGateway is shut down");
        }
        const modelId = request.model;
        const model = modelId ? this.modelRegistry.get(modelId) : undefined;
        if (!model) {
            throw new Error(`Model not found: ${modelId ?? "none specified"}`);
        }
        const provider = this.providers.get(model.provider);
        if (!provider) {
            throw new Error(`Provider not found: ${model.provider}`);
        }
        if (this.rateLimiter && !this.rateLimiter.allow(0)) {
            this.rateLimitedCount++;
            throw new Error("Rate limit exceeded");
        }
        const result = await provider.generateChatCompletion({
            model: model.id,
            messages: request.messages,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
        });
        this.totalRequests++;
        if (result.usage) {
            this.totalTokens += result.usage.totalTokens;
            this.totalCost += this.estimateCost(model.id, result.usage);
        }
        return {
            content: result.content,
            model: model.id,
            provider: model.provider,
            usage: result.usage,
            cost: result.usage ? this.estimateCost(model.id, result.usage) : undefined,
        };
    }
    async executeWithTools(request) {
        return this.execute(request);
    }
    getMetrics() {
        return {
            totalRequests: this.totalRequests,
            totalTokens: this.totalTokens,
            totalCost: this.totalCost,
            failoverCount: this.failoverCount,
            rateLimitedCount: this.rateLimitedCount,
        };
    }
    shutdown() {
        this.isShutdown = true;
    }
    estimateCost(modelId, usage) {
        const model = this.modelRegistry.get(modelId);
        if (!model)
            return 0;
        const inputCost = (usage.promptTokens / 1_000_000) * model.cost.costPer1MInput;
        const outputCost = (usage.completionTokens / 1_000_000) * model.cost.costPer1MOutput;
        return Math.round((inputCost + outputCost) * 10000) / 10000;
    }
}
//# sourceMappingURL=gateway.js.map