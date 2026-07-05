import { afterEach, describe, expect, it } from "vitest";

import { getDrenyraApiKey } from "../env";

describe("getDrenyraApiKey", () => {
	afterEach(() => {
		delete process.env.ARKELYTHEX_API_KEY;
		delete process.env.ARKALYTHIX_API_KEY;
	});

	it("prefers ARKELYTHEX_API_KEY", () => {
		process.env.ARKELYTHEX_API_KEY = "new-key";
		process.env.ARKALYTHIX_API_KEY = "legacy-key";
		expect(getDrenyraApiKey()).toBe("new-key");
	});

	it("falls back to ARKALYTHIX_API_KEY", () => {
		delete process.env.ARKELYTHEX_API_KEY;
		process.env.ARKALYTHIX_API_KEY = "legacy-key";
		expect(getDrenyraApiKey()).toBe("legacy-key");
	});

	it("returns undefined when unset", () => {
		expect(getDrenyraApiKey()).toBeUndefined();
	});

	it("treats whitespace-only ARKELYTHEX_API_KEY as unset", () => {
		process.env.ARKELYTHEX_API_KEY = "   ";
		process.env.ARKALYTHIX_API_KEY = "legacy-key";
		expect(getDrenyraApiKey()).toBe("legacy-key");
	});
});
