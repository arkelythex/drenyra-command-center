import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { complianceModule } from "../../index";

describe("compliance accounting jobs route", () => {
	const app = new Elysia().use(complianceModule);

	it("returns peru accounting jobs by default", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/compliance/accounting-jobs"),
		);

		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data.countryCode).toBe("pe");
		expect(payload.data.jobs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: "prepare-sire",
					title: "Preparar SIRE",
					approvalRequired: true,
				}),
			]),
		);
	});

	it("returns one country catalog via path param", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/compliance/accounting-jobs/mx"),
		);

		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data.countryCode).toBe("mx");
		expect(payload.data.jobs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: "cfdi-timbrado-review",
					title: "Timbrar CFDI",
				}),
			]),
		);
	});

	it("returns 404 for unsupported country path", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/compliance/accounting-jobs/ar"),
		);

		expect(response.status).toBe(404);

		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("ACCOUNTING_JOBS_NOT_SUPPORTED");
	});
});
