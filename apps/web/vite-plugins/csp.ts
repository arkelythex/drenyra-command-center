import type { IndexHtmlTransformContext, Plugin } from "vite";

const ANTI_FOUC_HASH = "sha256-QKnVpPMgkPXsfhewJUqCcAC86X3bUkbLigjXHa+W6jM=";

const getProductionCSP = () =>
	[
		"default-src 'self'",
		`script-src 'self' ${ANTI_FOUC_HASH}`,
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"connect-src 'self' ws://localhost:* http://localhost:* https://*.sentry.io",
		"img-src 'self' data: blob:",
		"worker-src 'self' blob:",
		"form-action 'self'",
		"base-uri 'self'",
	].join("; ");

const getDevelopmentCSP = () =>
	[
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"connect-src 'self' ws://localhost:* http://localhost:* https://*.sentry.io",
		"img-src 'self' data: blob:",
		"worker-src 'self' blob:",
		"form-action 'self'",
		"base-uri 'self'",
	].join("; ");

export function cspPlugin(): Plugin {
	return {
		name: "csp",
		enforce: "post",
		transformIndexHtml(html, ctx: IndexHtmlTransformContext) {
			const isDev = !!ctx.server;
			return {
				html,
				tags: [
					{
						tag: "meta",
						attrs: {
							"http-equiv": "Content-Security-Policy",
							content: isDev ? getDevelopmentCSP() : getProductionCSP(),
						},
						injectTo: "head",
					},
				],
			};
		},
	};
}
