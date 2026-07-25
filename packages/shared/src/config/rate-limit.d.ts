import type { Elysia } from "elysia";
export interface RateLimitConfig {
	max: number;
	windowMs: number;
	message?: string;
}
export declare function rateLimitMiddleware(config: RateLimitConfig): (
	app: Elysia,
) => Elysia<
	"",
	{
		decorator: {};
		store: {};
		derive: {};
		resolve: {};
	},
	{
		typebox: {};
		error: {};
	},
	{
		schema: {};
		standaloneSchema: {};
		macro: {};
		macroFn: {};
		parser: {};
		response: {};
	},
	{},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: {};
	},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: import("elysia").ExtractErrorFromHandle<{}>;
	}
>;
export declare const strictRateLimit: (app: Elysia) => Elysia<
	"",
	{
		decorator: {};
		store: {};
		derive: {};
		resolve: {};
	},
	{
		typebox: {};
		error: {};
	},
	{
		schema: {};
		standaloneSchema: {};
		macro: {};
		macroFn: {};
		parser: {};
		response: {};
	},
	{},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: {};
	},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: import("elysia").ExtractErrorFromHandle<{}>;
	}
>;
export declare const standardRateLimit: (app: Elysia) => Elysia<
	"",
	{
		decorator: {};
		store: {};
		derive: {};
		resolve: {};
	},
	{
		typebox: {};
		error: {};
	},
	{
		schema: {};
		standaloneSchema: {};
		macro: {};
		macroFn: {};
		parser: {};
		response: {};
	},
	{},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: {};
	},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: import("elysia").ExtractErrorFromHandle<{}>;
	}
>;
export declare const lenientRateLimit: (app: Elysia) => Elysia<
	"",
	{
		decorator: {};
		store: {};
		derive: {};
		resolve: {};
	},
	{
		typebox: {};
		error: {};
	},
	{
		schema: {};
		standaloneSchema: {};
		macro: {};
		macroFn: {};
		parser: {};
		response: {};
	},
	{},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: {};
	},
	{
		derive: {};
		resolve: {};
		schema: {};
		standaloneSchema: {};
		response: import("elysia").ExtractErrorFromHandle<{}>;
	}
>;
//# sourceMappingURL=rate-limit.d.ts.map
