import { describe, expect, it } from "vitest";
import { readHeader } from "../../governance-audit.headers";

describe("readHeader", () => {
	it("returns a trimmed direct header value", () => {
		expect(readHeader({ "x-company-id": " company-1 " }, "x-company-id")).toBe(
			"company-1",
		);
	});

	it("falls back to the lowercase header key", () => {
		expect(readHeader({ "x-company-id": "company-1" }, "X-Company-Id")).toBe(
			"company-1",
		);
	});

	it("returns an empty string for blank, non-string, and absent headers", () => {
		expect(readHeader({ authorization: "   " }, "authorization")).toBe("");
		expect(readHeader({ "x-company-id": ["company-1"] }, "x-company-id")).toBe(
			"",
		);
		expect(readHeader({}, "x-company-id")).toBe("");
	});
});
