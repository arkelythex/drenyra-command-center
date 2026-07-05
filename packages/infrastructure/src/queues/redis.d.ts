import IORedis from "ioredis";
export declare function isRedisConfigured(): boolean;
export declare function getRedisConnection(): IORedis;
export declare function closeRedisConnection(): Promise<void>;
export declare function isRedisReady(): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map
