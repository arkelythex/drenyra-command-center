import IORedis from "ioredis";
import { loggers } from "../logger";

let redis = null;
export function isRedisConfigured() {
	return Boolean(process.env.REDIS_URL);
}
export function getRedisConnection() {
	if (!redis) {
		const redisUrl = process.env.REDIS_URL;
		if (!redisUrl) {
			throw new Error(
				"REDIS_URL no está configurado. Las colas de procesamiento requieren Redis.",
			);
		}
		redis = new IORedis(redisUrl, {
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
			retryStrategy: (times) => {
				if (times > 3) {
					loggers.redis.error("Max connection retries reached", {
						retries: times,
					});
					return null;
				}
				return Math.min(times * 200, 1000);
			},
		});
		redis.on("connect", () => {
			loggers.redis.info("Connected");
		});
		redis.on("error", (err) => {
			loggers.redis.error("Connection error", { error: err.message });
		});
	}
	return redis;
}
export async function closeRedisConnection() {
	if (redis) {
		await redis.quit();
		redis = null;
		loggers.redis.info("Connection closed");
	}
}
export async function isRedisReady() {
	if (!isRedisConfigured()) {
		return false;
	}
	try {
		const connection = getRedisConnection();
		await connection.ping();
		return true;
	} catch {
		return false;
	}
}
