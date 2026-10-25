import type { Plugin } from "vite";

const STUB_PREFIX = "\0server-only-stub:";

/** Server-only modules that shared packages import, and the names they use. */
const STUBS: Record<string, string> = {
	"node:crypto": "crypto",
	crypto: "crypto",
};

const CRYPTO_STUB = `
const fail = (name) => () => {
	throw new Error(\`\${name} es solo de servidor (server-only): no se puede usar en el navegador\`);
};
export function createHash(...args) {
	return fail("crypto.createHash")(...args);
}
export default { createHash };
`;

/**
 * On the dev server, stands in for server-only modules that the shared
 * packages import (`@drenyra/domain` hashes receipts with `node:crypto`).
 * Vite's own browser stub throws as soon as such a module is imported,
 * which left the whole app blank; this stub only throws if the browser
 * actually calls the server-only code. The build drops these imports
 * instead (see `isServerOnlyModule`).
 */
export function serverOnlyStubsPlugin(): Plugin {
	return {
		name: "drenyra:server-only-stubs",
		apply: "serve",
		enforce: "pre",
		resolveId(id) {
			const stub = STUBS[id];
			return stub ? `${STUB_PREFIX}${stub}` : null;
		},
		load(id) {
			return id === `${STUB_PREFIX}crypto` ? CRYPTO_STUB : null;
		},
	};
}
