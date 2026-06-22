import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { complianceModule } from "../../index";

describe("compliance country pack route", () => {
	const app = new Elysia().use(complianceModule);

	it("returns the supported LATAM country packs", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/compliance/country-packs"),
		);

		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data.defaultCountryCode).toBe("pe");
		expect(payload.data.supportedCountries).toEqual(["pe", "mx", "cl", "co"]);
		expect(payload.data.packs).toHaveLength(4);
		expect(payload.data.packs[0]).toMatchObject({
			code: "pe",
			taxIdLabel: "RUC",
		});
	});

	it("returns one supported country pack", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/compliance/country-packs/mx"),
		);

		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data.pack).toMatchObject({
			code: "mx",
			taxIdLabel: "RFC",
			defaultCurrency: "MXN",
		});
	});

	it("returns 404 for unsupported country packs", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/compliance/country-packs/ar"),
		);

		expect(response.status).toBe(404);

		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("COUNTRY_PACK_NOT_SUPPORTED");
	});
});
