import { describe, expect, it } from "vitest";
import {
	getLedgerErrorMessage,
	unwrapOkEnvelope,
} from "../ledger-api-response";

describe("unwrapOkEnvelope", () => {
	it("returns inner data when envelope is success", () => {
		expect(unwrapOkEnvelope({ success: true, data: [1, 2] })).toEqual([1, 2]);
	});

	it("throws when envelope reports failure", () => {
		expect(() => unwrapOkEnvelope({ success: false, error: "falló" })).toThrow(
			"falló",
		);
	});

	it("passes through non-envelope payloads", () => {
		expect(unwrapOkEnvelope([{ a: 1 }])).toEqual([{ a: 1 }]);
	});
});

describe("getLedgerErrorMessage", () => {
	it("extracts string and Error messages", () => {
		expect(getLedgerErrorMessage("x")).toBe("x");
		expect(getLedgerErrorMessage(new Error("e"))).toBe("e");
	});
});
