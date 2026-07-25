import { type IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ProxyOptions } from "vite";

const DEFAULT_API_PROXY_TARGET = "http://localhost:3000";

type EnvMap = Record<string, string | undefined>;

type ProxyErrorPayload = {
	success: false;
	code: "DEV_API_PROXY_UNAVAILABLE";
	error: "Local API unavailable";
	message: string;
	details: {
		requestPath: string;
		target: string;
		cause: string;
	};
};

type ErrorWithCode = Error & { code?: string };

type ConnectNext = (error?: unknown) => void;
type ConnectMiddleware = (
	req: IncomingMessage,
	res: ServerResponse,
	next: ConnectNext,
) => void;
type ApiReachabilityChecker = (target: string) => Promise<boolean>;

let reachabilityCache: {
	target: string;
	reachable: boolean;
	checkedAt: number;
} | null = null;

export function resolveApiProxyTarget(env: EnvMap = process.env): string {
	const viteTarget = env.VITE_API_PROXY_TARGET?.trim();
	if (viteTarget) return viteTarget;

	const apiTarget = env.API_PROXY_TARGET?.trim();
	if (apiTarget) return apiTarget;

	return DEFAULT_API_PROXY_TARGET;
}

export function createApiProxyErrorPayload(
	error: ErrorWithCode,
	requestPath: string,
	target: string,
): ProxyErrorPayload {
	const cause = error.code ?? error.name ?? "PROXY_ERROR";

	return {
		success: false,
		code: "DEV_API_PROXY_UNAVAILABLE",
		error: "Local API unavailable",
		message: `Vite could not proxy ${requestPath} to ${target}. Start the API with \`bun run --cwd apps/api dev\` or use root \`bun run dev\` to start API + Web together.`,
		details: {
			requestPath,
			target,
			cause,
		},
	};
}

export function handleApiProxyError(
	error: ErrorWithCode,
	req: IncomingMessage,
	res: ServerResponse,
	target = resolveApiProxyTarget(),
): void {
	if (res.headersSent || res.writableEnded) return;

	const payload = createApiProxyErrorPayload(error, req.url ?? "/api", target);

	res.writeHead(503, { "Content-Type": "application/json" });
	res.end(JSON.stringify(payload));
}

export async function canReachApiTarget(target: string): Promise<boolean> {
	const now = Date.now();
	if (
		reachabilityCache &&
		reachabilityCache.target === target &&
		now - reachabilityCache.checkedAt < 1_000
	) {
		return reachabilityCache.reachable;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 300);

	try {
		await fetch(target, {
			method: "GET",
			signal: controller.signal,
		});
		reachabilityCache = { target, reachable: true, checkedAt: now };
		return true;
	} catch {
		reachabilityCache = { target, reachable: false, checkedAt: now };
		return false;
	} finally {
		clearTimeout(timeout);
	}
}

export function createApiAvailabilityMiddleware(
	target: string,
	checker: ApiReachabilityChecker = canReachApiTarget,
): ConnectMiddleware {
	return (req, res, next) => {
		if (!req.url?.startsWith("/api")) {
			next();
			return;
		}

		void checker(target)
			.then((reachable) => {
				if (reachable) {
					next();
					return;
				}

				handleApiProxyError(
					Object.assign(new Error("Local API target is unavailable"), {
						code: "ECONNREFUSED",
					}),
					req,
					res,
					target,
				);
			})
			.catch((error: unknown) => {
				handleApiProxyError(
					error instanceof Error
						? error
						: new Error("Local API target is unavailable"),
					req,
					res,
					target,
				);
			});
	};
}

export function createApiDevServerPlugin(env: EnvMap = process.env): Plugin {
	const target = resolveApiProxyTarget(env);

	return {
		name: "drenyra-dev-api-availability",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use(createApiAvailabilityMiddleware(target));
		},
	};
}

export function createApiProxyConfig(env: EnvMap = process.env): ProxyOptions {
	const target = resolveApiProxyTarget(env);

	return {
		target,
		changeOrigin: true,
		secure: false,
		cookieDomainRewrite: "localhost",
		configure(proxy) {
			proxy.on("error", (error, req, res) => {
				if (res instanceof ServerResponse) {
					handleApiProxyError(error, req, res, target);
				}
			});
		},
	};
}
