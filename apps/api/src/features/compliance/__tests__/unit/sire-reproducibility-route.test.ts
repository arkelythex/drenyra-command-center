import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComplianceService } from "../../../../services/compliance.service";
import { complianceModule } from "../../index";

describe("compliance sire reproducibility route", () => {
	const app = new Elysia().use(complianceModule);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns reproducibility report when service succeeds", async () => {
		vi.spyOn(ComplianceService, "verifySireReproducibility").mockResolvedValue({
			period: "2026-02",
			companyId: "cmp-1",
			reproducible: true,
			coverage: "COMPLETE_DATA",
			sire: { recordCount: 20, totalAmount: 1000, totalIGV: 180 },
			ledger: { recordCount: 20, totalAmount: 1000, totalIGV: 180 },
			differences: { recordCount: 0, totalAmount: 0, totalIGV: 0 },
			tolerances: { recordCount: 0, totalAmount: 0.01, totalIGV: 0.01 },
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/sire-reproducibility?companyId=cmp-1&year=2026&month=2",
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				companyId: "cmp-1",
				reproducible: true,
				coverage: "COMPLETE_DATA",
			},
		});
	});

	it("returns reproducibility mismatch payload with runbookId", async () => {
		vi.spyOn(ComplianceService, "verifySireReproducibility").mockResolvedValue({
			period: "2026-02",
			companyId: "cmp-1",
			reproducible: false,
			coverage: "PARTIAL_DATA",
			sire: { recordCount: 20, totalAmount: 1000, totalIGV: 180 },
			ledger: { recordCount: 19, totalAmount: 999.5, totalIGV: 179.91 },
			differences: { recordCount: 1, totalAmount: 0.5, totalIGV: 0.09 },
			tolerances: { recordCount: 0, totalAmount: 0.01, totalIGV: 0.01 },
			runbookId: "RB-SIRE-LEDGER-REPRO-2026-02",
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/sire-reproducibility?companyId=cmp-1&year=2026&month=2",
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				reproducible: false,
				coverage: "PARTIAL_DATA",
				runbookId: "RB-SIRE-LEDGER-REPRO-2026-02",
			},
		});
	});

	it("returns internal error envelope with runbook when service throws", async () => {
		vi.spyOn(ComplianceService, "verifySireReproducibility").mockRejectedValue(
			new Error("DB unavailable"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/sire-reproducibility?companyId=cmp-1&year=2026&month=2",
			),
		);

		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "INTERNAL_ERROR",
			runbook: {
				id: "RB-SIRE-LEDGER-REPRO-2026-02",
			},
		});
	});
});
