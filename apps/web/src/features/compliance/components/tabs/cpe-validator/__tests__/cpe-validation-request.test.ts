import { describe, expect, it } from "vitest";
import { buildCpeValidationRequest } from "../cpe-validation-request";
import { MOCK_CPES } from "../cpe-validator.mock";

describe("buildCpeValidationRequest", () => {
	it("maps observed documents to the sandbox/replay observed correlativo", () => {
		const row = MOCK_CPES.find((item) => item.sunatCode === "0101");
		expect(row).toBeDefined();

		const request = buildCpeValidationRequest(row!);

		expect(request.companyRuc).toBe("20100070970");
		expect(request.cpeNumber.endsWith("7777")).toBe(true);
		expect(request.xmlContent).toContain("<cbc:ID>20100070970</cbc:ID>");
	});

	it("maps rejected documents to the valid sandbox RUC prefix used by the API", () => {
		const row = MOCK_CPES.find((item) => item.sunatCode === "2320");
		expect(row).toBeDefined();

		const request = buildCpeValidationRequest(row!);

		expect(request.companyRuc).toBe("99999000009");
		expect(request.xmlContent).toContain("<cbc:ID>99999000009</cbc:ID>");
	});
});
