import { describe, expect, it } from "vitest";
import { isServerOnlyModule, resolveManualChunk } from "./bundle-rules";

describe("isServerOnlyModule", () => {
	it("externalizes Node built-ins and server clients by exact name", () => {
		for (const id of [
			"crypto",
			"fs",
			"path",
			"os",
			"stream",
			"redis",
			"postgres",
		]) {
			expect(isServerOnlyModule(id)).toBe(true);
		}
		expect(isServerOnlyModule("node:crypto")).toBe(true);
	});

	it("never externalizes browser packages whose name merely contains a built-in", () => {
		for (const id of [
			"@radix-ui/react-compose-refs",
			"@radix-ui/react-popover",
			"/repo/node_modules/some-path-helper/index.js",
			"/repo/src/features/ostatus/os-badge.tsx",
			"/repo/src/lib/streaming.ts",
		]) {
			expect(isServerOnlyModule(id)).toBe(false);
		}
	});
});

describe("resolveManualChunk", () => {
	it("ignores first-party code", () => {
		expect(resolveManualChunk("/repo/src/react/app.tsx")).toBeUndefined();
	});

	it("checks Sentry before React so @sentry/react is not swallowed", () => {
		expect(resolveManualChunk("/n/node_modules/@sentry/react/index.js")).toBe(
			"vendor-sentry",
		);
		expect(resolveManualChunk("/n/node_modules/react/index.js")).toBe(
			"vendor-react",
		);
	});

	it("keeps opted-out libraries in default chunking", () => {
		expect(resolveManualChunk("/n/node_modules/recharts/x.js")).toBeUndefined();
		expect(
			resolveManualChunk("/n/node_modules/@dnd-kit/core/x.js"),
		).toBeUndefined();
	});

	it("maps the remaining vendor groups", () => {
		expect(
			resolveManualChunk("/n/node_modules/@radix-ui/react-slot/x.js"),
		).toBe("vendor-radix");
		expect(resolveManualChunk("/n/node_modules/zod/x.js")).toBe("vendor-forms");
		expect(resolveManualChunk("/n/node_modules/lucide-react/x.js")).toBe(
			"vendor-ui",
		);
		expect(
			resolveManualChunk("/n/node_modules/unknown-lib/x.js"),
		).toBeUndefined();
	});
});
