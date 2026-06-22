/**
 * Redis Connection Singleton
 *
 * Provides a shared Redis connection for BullMQ and other services.
 * Falls back to a mock implementation in development without Redis.
 */

import IORedis from "ioredis";
import { loggers } from "../logger";

let redis: IORedis | null = null;

/**
 * Check if Redis is configured
 * @returns Result of isRedisConfigured.
 * @example
 * ```ts
 * const result = isRedisConfigured();
 * console.log(result);
 * ```
 */

export function isRedisConfigured(): boolean {
	return Boolean(process.env.REDIS_URL);
}

/**
 * Get Redis connection singleton
 * @throws Error when `REDIS_URL` is not configured.
 * @returns Result of getRedisConnection.
 * @example
 * ```ts
 * const result = getRedisConnection();
 * console.log(result);
 * ```
 */

export function getRedisConnection(): IORedis {
	if (!redis) {
		const redisUrl = process.env.REDIS_URL;

		if (!redisUrl) {
			throw new Error(
				"REDIS_URL no está configurado. Las colas de procesamiento requieren Redis.",
			);
		}

		redis = new IORedis(redisUrl, {
			maxRetriesPerRequest: null, // Required for BullMQ
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

/**
 * Close Redis connection
 * @returns Result of closeRedisConnection.
 * @example
 * ```ts
 * const result = await closeRedisConnection();
 * console.log(result);
 * ```
 */

export async function closeRedisConnection(): Promise<void> {
	if (redis) {
		await redis.quit();
		redis = null;
		loggers.redis.info("Connection closed");
	}
}

/**
 * Check if Redis connection is ready
 * @returns Result of isRedisReady.
 * @example
 * ```ts
 * const result = await isRedisReady();
 * console.log(result);
 * ```
 */

export async function isRedisReady(): Promise<boolean> {
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
