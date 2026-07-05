export interface CacheConfig {
	ttlSeconds?: number;
	displayName?: string;
}
export interface CachedContext {
	id: string;
	name: string;
	displayName: string;
	createTime: string;
	expireTime: string;
	ttl: string;
}
export declare class ContextCacheService {
	private apiKey;
	private baseUrl;
	private cachedContextId;
	constructor();
	createPCGECache(config?: CacheConfig): Promise<CachedContext>;
	getCachedContextId(): string | null;
	listCaches(): Promise<CachedContext[]>;
	deleteCache(cacheName: string): Promise<boolean>;
	getSystemInstruction(): string;
}
export declare function getContextCacheService(): ContextCacheService;
//# sourceMappingURL=context-cache.service.d.ts.map
