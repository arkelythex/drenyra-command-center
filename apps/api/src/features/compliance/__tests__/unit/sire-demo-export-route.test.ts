import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SireRegisterExportService as SIREService } from "../../../sire/services/sire-register-export.service";
import { complianceModule } from "../../index";

describe("compliance sire demo export route", () => {
	const app = new Elysia().use(complianceModule);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns a TXT attachment for sales register download", async () => {
		vi.spyOn(SIREService, "generateSalesRegister").mockResolvedValue(
			"20260300|1|15/03/2026|01|F001|00000001|00000001|6|20123456789|DEMO|0.00|100.00|0.00|18.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|118.00|PEN|1.000|||||1",
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/sire-demo-export?companyId=cmp-1&ledgerType=ventas&format=TXT&period=2026-03",
			),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/plain");
		expect(response.headers.get("content-disposition")).toContain(
			"sire-RVIE-2026-03.txt",
		);
		expect(await response.text()).toContain("20260300");
	});

	it("returns an Excel attachment for purchases register download", async () => {
		vi.spyOn(SIREService, "generatePurchasesRegister").mockResolvedValue(
			Buffer.from("excel-demo"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/sire-demo-export?companyId=cmp-1&ledgerType=compras&format=EXCEL&period=2026-03",
			),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
		expect(response.headers.get("content-disposition")).toContain(
			"sire-RCE-2026-03.xlsx",
		);
		expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
	});
});
