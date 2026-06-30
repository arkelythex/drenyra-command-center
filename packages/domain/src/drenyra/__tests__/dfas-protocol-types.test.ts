import { describe, expect, it } from "vitest";
import {
	DFAS_ITEM_TYPE,
	DFAS_PROTOCOL_VERSION,
	dfasScopesMatch,
	isValidDfasFiscalScope,
} from "../dfas-protocol-types";
import type { DrenyraFiscalScope } from "../types";

const validScope: DrenyraFiscalScope = {
	organizationId: "org-1",
	companyId: "cmp-1",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
};

describe("dfas-protocol-types", () => {
	it("accepts valid fiscal scope", () => {
		expect(isValidDfasFiscalScope(validScope)).toBe(true);
	});

	it("rejects invalid RUC", () => {
		expect(isValidDfasFiscalScope({ ...validScope, companyRuc: "123" })).toBe(
			false,
		);
	});

	it("rejects invalid period", () => {
		expect(isValidDfasFiscalScope({ ...validScope, period: "2026-13" })).toBe(
			false,
		);
	});

	it("matches scopes with same tuple", () => {
		expect(dfasScopesMatch(validScope, { ...validScope })).toBe(true);
	});

	it("rejects scope mismatch on period", () => {
		expect(
			dfasScopesMatch(validScope, { ...validScope, period: "2026-06" }),
		).toBe(false);
	});

	it("exports protocol version 1.0.0", () => {
		expect(DFAS_PROTOCOL_VERSION).toBe("1.0.0");
	});

	it("defines all item types", () => {
		expect(DFAS_ITEM_TYPE.ENVELOPE).toBe("envelope");
		expect(DFAS_ITEM_TYPE.TRUTH_PROMOTED).toBe("truth_promoted");
	});
});
