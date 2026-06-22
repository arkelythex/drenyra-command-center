import { describe, expect, it } from "vitest";
import { resolveTrustedOriginsFromEnv } from "../../lib/auth-trusted-origins";

describe("resolveTrustedOriginsFromEnv", () => {
	it("includes local defaults when env is empty", () => {
		const origins = resolveTrustedOriginsFromEnv(undefined);

		expect(origins).toEqual(
			expect.arrayContaining([
				"http://localhost:3000",
				"http://localhost:5173",
				"http://127.0.0.1:5173",
				"http://localhost:4173",
				"http://127.0.0.1:4173",
			]),
		);
	});

	it("merges extra LAN origins from env and de-duplicates", () => {
		const origins = resolveTrustedOriginsFromEnv(
			"http://192.168.18.4:5173, http://localhost:5173 ,http://10.0.0.20:4173",
		);

		expect(origins).toContain("http://192.168.18.4:5173");
		expect(origins).toContain("http://10.0.0.20:4173");
		expect(origins.filter((item) => item === "http://localhost:5173")).toHaveLength(1);
	});
});

