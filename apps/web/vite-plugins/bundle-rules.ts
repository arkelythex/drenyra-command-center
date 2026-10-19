/** Pure bundling rules used by `vite.config.ts`; kept apart so they can be tested. */

/**
 * First matching rule wins. Order matters: `/@sentry/` must precede `/react/`,
 * and rules mapped to `undefined` keep a dependency in the default chunking.
 */
const MANUAL_CHUNK_RULES: ReadonlyArray<
	readonly [patterns: readonly string[], chunk: string | undefined]
> = [
	[["/@sentry/"], "vendor-sentry"],
	[["/react/", "/react-dom/"], "vendor-react"],
	[["/xstate/"], "vendor-xstate"],
	[["/nanostores/"], "vendor-misc"],
	[["/@tanstack/"], "vendor-tanstack"],
	[["/@radix-ui/"], "vendor-radix"],
	[["/@dnd-kit/"], undefined],
	[["/recharts/", "/d3-"], undefined],
	[["/react-hook-form/", "/zod/", "/@hookform/"], "vendor-forms"],
	[["/@react-pdf/", "/qrcode/"], "vendor-docs"],
	[["/tailwind-merge/"], "vendor-utils"],
	[["/framer-motion/", "/motion-dom/"], "vendor-animation"],
	[["/lucide-react/", "/sonner/"], "vendor-ui"],
];

export function resolveManualChunk(id: string): string | undefined {
	if (!id.includes("node_modules")) return undefined;
	const rule = MANUAL_CHUNK_RULES.find(([patterns]) =>
		patterns.some((pattern) => id.includes(pattern)),
	);
	return rule?.[1];
}

/**
 * Server-only modules that must never be bundled for the browser. Matched
 * exactly: substring matching ("fs", "os", "path"...) externalized packages
 * such as `@radix-ui/react-compose-refs` and left bare imports in the bundle,
 * which blanked the app.
 */
const SERVER_ONLY_MODULES: ReadonlySet<string> = new Set([
	"crypto",
	"fs",
	"path",
	"os",
	"stream",
	"redis",
	"postgres",
]);

export function isServerOnlyModule(id: string): boolean {
	return id.startsWith("node:") || SERVER_ONLY_MODULES.has(id);
}
