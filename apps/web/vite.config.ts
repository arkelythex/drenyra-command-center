import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import {
	createApiDevServerPlugin,
	createApiProxyConfig,
} from "./vite.dev-api-proxy";
import { visualizer } from "rollup-plugin-visualizer";
import { cspPlugin } from "./vite-plugins/csp";

const enableReactCompiler =
	process.env.NODE_ENV === "production" || process.env.REACT_COMPILER === "1";

function resolveManualChunk(id: string): string | undefined {
	if (!id.includes("node_modules")) return undefined;

	// IMPORTANT: @sentry/react would match /react/ — check Sentry FIRST
	if (id.includes("/@sentry/")) return "vendor-sentry";
	if (id.includes("/react/") || id.includes("/react-dom/"))
		return "vendor-react";
	if (id.includes("/xstate/")) return "vendor-xstate";
	if (id.includes("/nanostores/")) return "vendor-misc";
	if (id.includes("/@tanstack/")) return "vendor-tanstack";
	if (id.includes("/@radix-ui/")) return "vendor-radix";
	if (id.includes("/@dnd-kit/")) return undefined;
	if (id.includes("/recharts/") || id.includes("/d3-")) return undefined;
	if (
		id.includes("/react-hook-form/") ||
		id.includes("/zod/") ||
		id.includes("/@hookform/")
	)
		return "vendor-forms";
	if (id.includes("/@react-pdf/") || id.includes("/qrcode/"))
		return "vendor-docs";
	if (id.includes("/tailwind-merge/")) return "vendor-utils";
	if (id.includes("/framer-motion/") || id.includes("/motion-dom/"))
		return "vendor-animation";
	if (id.includes("/lucide-react/") || id.includes("/sonner/"))
		return "vendor-ui";

	return undefined;
}

export default defineConfig({
	// React Compiler configuration for 2026 - automatic memoization
	// See: https://react.dev/learn/react-compiler
	resolve: {
		tsconfigPaths: true,
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/components": path.resolve(__dirname, "./src/components"),
			"@/lib": path.resolve(__dirname, "./src/lib"),
			"@/hooks": path.resolve(__dirname, "./src/hooks"),
			"@/context": path.resolve(__dirname, "./src/context"),
			"@/store": path.resolve(__dirname, "./src/store"),
			"@arkelythex/shared": path.resolve(__dirname, "../../packages/shared/src"),
		},
	},
	plugins: [
		createApiDevServerPlugin(),
		TanStackRouterVite({
			generatedRouteTree: "./src/routeTree.gen.ts",
		}),
		react(
			enableReactCompiler
				? {
						// React Compiler is intentionally production-first here:
						// keeping it off by default in dev avoids expensive cold
						// transforms across the generated route tree.
						babel: {
							plugins: [["babel-plugin-react-compiler", { target: "19" }]],
						},
					}
				: undefined,
		),
		tailwindcss(),
		cspPlugin(),
		...(process.env.ANALYZE === "1"
			? [
					visualizer({
						filename: "dist/stats.html",
						template: "sunburst",
						gzipSize: true,
						brotliSize: true,
					}),
				]
			: []),
	],
	server: {
		host: process.env.WEB_HOST || "0.0.0.0",
		port: Number(process.env.WEB_PORT || 5173),
		strictPort: true,
		warmup: {
			clientFiles: [
				"./src/client.tsx",
				"./src/routes/login.tsx",
				"./src/features/auth/components/LoginForm.tsx",
				"./src/features/auth/components/AuthLayout.tsx",
				"./src/routes/index.tsx",
			],
		},
		proxy: {
			"/api": createApiProxyConfig(),
		},
	},
	optimizeDeps: {
		// Pre-bundle lazily loaded deps to avoid transient 504/chunk-miss issues in dev.
		include: ["@tanstack/react-query-devtools"],
		exclude: ["@arkelythex/infrastructure"],
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					return resolveManualChunk(id);
				},
			},
			external: (id) => {
				// Externalize Node.js modules that shouldn't be in frontend bundle
				if (
					id.includes("crypto") ||
					id.includes("fs") ||
					id.includes("path") ||
					id.includes("os") ||
					id.includes("stream") ||
					id.includes("redis") ||
					id.includes("postgres")
				) {
					return true;
				}
				return false;
			},
		},
	},
});
