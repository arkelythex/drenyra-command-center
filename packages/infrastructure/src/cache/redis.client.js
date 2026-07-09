import Redis from "ioredis";

const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
const redisOptions = {
	lazyConnect: true,
	maxRetriesPerRequest: isTest ? 0 : 3,
	enableOfflineQueue: !isTest,
};
export const redis = process.env.REDIS_URL
	? new Redis(process.env.REDIS_URL, redisOptions)
	: new Redis({
			host: process.env.REDIS_HOST || "localhost",
			port: parseInt(process.env.REDIS_PORT || "6379", 10),
			...redisOptions,
		});
if (!isTest) {
	let lastErrorLogAtMs = 0;
	redis.on("error", (error) => {
		const now = Date.now();
		if (now - lastErrorLogAtMs < 30_000) return;
		lastErrorLogAtMs = now;
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`[REDIS] ${message}`);
	});
}
export const CACHE_TTL = {
	TAX_RULES: 60 * 60 * 24 * 365,
	RUC_VALIDATION: 60 * 60 * 24 * 7,
	AI_CLASSIFICATION: 60 * 60 * 24 * 30,
	EXCHANGE_RATE: 60 * 60 * 4,
	SESSION: 60 * 60 * 24 * 7,
};

