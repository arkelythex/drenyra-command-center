import path from "node:path";
import { federation } from "@module-federation/vite";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import {
	createApiDevServerPlugin,
	createApiProxyConfig,
} from "./vite.dev-api-proxy";
import {
	isServerOnlyModule,
	resolveManualChunk,
} from "./vite-plugins/bundle-rules";
import { cspPlugin } from "./vite-plugins/csp";
import { serverOnlyStubsPlugin } from "./vite-plugins/server-only-stubs";

const enableReactCompiler =
	process.env.NODE_ENV === "production" || process.env.REACT_COMPILER === "1";

/**
 * Module Federation is opt-in (`MF_REMOTE=1`). The federation plugin emits
 * shared-dependency chunks that import raw `/node_modules/...` paths, so a
 * federated build renders a blank page when served standalone.
 */
const buildFederatedRemote = process.env.MF_REMOTE === "1";

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
			"@drenyra/shared": path.resolve(__dirname, "../../packages/shared/src"),
		},
	},
	plugins: [
		serverOnlyStubsPlugin(),
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
		...(buildFederatedRemote
			? [
					federation({
						name: "drenyra",
						filename: "remoteEntry.js",
						exposes: { "./App": "./src/remote-entry.tsx" },
						shared: {
							react: { singleton: true, requiredVersion: "^19.2.4" },
							"react-dom": { singleton: true, requiredVersion: "^19.2.4" },
							zustand: { singleton: true, requiredVersion: "^5.0.0" },
							"@tanstack/react-router": {
								singleton: true,
								requiredVersion: "^1.103.0",
							},
							"@tanstack/react-query": {
								singleton: true,
								requiredVersion: "^5.0.0",
							},
						},
					}),
				]
			: []),
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
		port: Number(process.env.WEB_PORT || 5174),
		strictPort: true,
		warmup: {
			clientFiles: [
				"./src/client.tsx",
				"./src/routes/login.tsx",
				"./src/features/auth/components/LoginForm/LoginForm.tsx",
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
		exclude: [
			"@drenyra/infrastructure",
			...(buildFederatedRemote ? ["@module-federation/vite"] : []),
		],
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					return resolveManualChunk(id);
				},
			},
			external: isServerOnlyModule,
			// An unused server-only import must vanish instead of surviving as a bare
			// `import "node:crypto"` that the browser cannot resolve.
			treeshake: {
				moduleSideEffects: (_id, external) => (external ? false : undefined),
			},
		},
	},
});
