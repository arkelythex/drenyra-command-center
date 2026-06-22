import { afterEach, describe, expect, it } from "vitest";

import { getArkelythexApiKey } from "../env";

describe("getArkelythexApiKey", () => {
	afterEach(() => {
		delete process.env.ARKELYTHEX_API_KEY;
		delete process.env.ARKALYTHIX_API_KEY;
	});

	it("prefers ARKELYTHEX_API_KEY", () => {
		process.env.ARKELYTHEX_API_KEY = "new-key";
		process.env.ARKALYTHIX_API_KEY = "legacy-key";
		expect(getArkelythexApiKey()).toBe("new-key");
	});

	it("falls back to ARKALYTHIX_API_KEY", () => {
		delete process.env.ARKELYTHEX_API_KEY;
		process.env.ARKALYTHIX_API_KEY = "legacy-key";
		expect(getArkelythexApiKey()).toBe("legacy-key");
	});

	it("returns undefined when unset", () => {
		expect(getArkelythexApiKey()).toBeUndefined();
	});

	it("treats whitespace-only ARKELYTHEX_API_KEY as unset", () => {
		process.env.ARKELYTHEX_API_KEY = "   ";
		process.env.ARKALYTHIX_API_KEY = "legacy-key";
		expect(getArkelythexApiKey()).toBe("legacy-key");
	});
});
