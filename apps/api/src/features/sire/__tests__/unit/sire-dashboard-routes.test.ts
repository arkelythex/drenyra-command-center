import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock resolveSessionContext so the companyScopeGuard doesn't reject requests
vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

import { ComplianceService } from "../../../../services/compliance.service";
import { FiscalIndicatorsService } from "../../../dashboard/application/services/fiscal-indicators.service";
import { sireModule } from "../../index";
import { resetSireRateLimitStateForTests } from "../../middleware/rate-limit.middleware";
import { createSireAuthHeaders } from "../support/sire-auth-test-helpers";

describe("sire dashboard and conciliation routes", () => {
	const app = new Elysia().use(sireModule);
	const jwtSecret = "test-sire-secret-12345678901234567890";

	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp_123",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		resetSireRateLimitStateForTests();
		delete process.env.SIRE_POLICY_REFERENCE_DATE;
		delete process.env.SIRE_2026_POSTPONED_UNTIL;
		delete process.env.SIRE_JWT_SECRET;
	});

	it("returns conciliation report", async () => {
		process.env.SIRE_JWT_SECRET = jwtSecret;
		vi.spyOn(ComplianceService, "verifySireReproducibility").mockResolvedValue({
			period: "2026-02",
			companyId: "cmp_1",
			reproducible: true,
			coverage: "COMPLETE_DATA",
			sire: { recordCount: 10, totalAmount: 100, totalIGV: 18 },
			ledger: { recordCount: 10, totalAmount: 100, totalIGV: 18 },
			differences: { recordCount: 0, totalAmount: 0, totalIGV: 0 },
			tolerances: { recordCount: 0, totalAmount: 0.01, totalIGV: 0.01 },
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/sire/conciliation?companyId=cmp_1&period=2026-02",
				{
					headers: createSireAuthHeaders("cmp_1", jwtSecret),
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				reproducible: true,
				period: "2026-02",
			},
		});
	});

	it("returns runbook when conciliation fails", async () => {
		process.env.SIRE_JWT_SECRET = jwtSecret;
		vi.spyOn(ComplianceService, "verifySireReproducibility").mockRejectedValue(
			new Error("DB unavailable"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/sire/conciliation?companyId=cmp_1&period=2026-02",
				{
					headers: createSireAuthHeaders("cmp_1", jwtSecret),
				},
			),
		);

		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SIRE_CONCILIATION_ERROR",
			runbook: {
				id: "RB-SIRE-LEDGER-REPRO-2026-02",
			},
		});
	});

	it("returns sire dashboard summary with deadline and submission mode", async () => {
		process.env.SIRE_JWT_SECRET = jwtSecret;
		process.env.SIRE_POLICY_REFERENCE_DATE = "2026-05-20T00:00:00.000Z";
		process.env.SIRE_2026_POSTPONED_UNTIL = "2026-06-01";

		vi.spyOn(ComplianceService, "getDashboard").mockResolvedValue({
			score: 96,
			totalIssues: 1,
			criticalIssues: 0,
			highIssues: 0,
			mediumIssues: 1,
			lowIssues: 0,
			sunatStatus: "COMPLIANT",
			lastAudit: new Date("2026-02-13T00:00:00.000Z"),
		});
		vi.spyOn(ComplianceService, "getIssues").mockResolvedValue([
			{
				id: "issue-1",
				companyId: "cmp_1",
				type: "MISSING_SUNAT",
				severity: "HIGH",
				title: "Issue",
				description: "Issue desc",
				createdAt: new Date("2026-02-12T00:00:00.000Z"),
			},
		]);
		vi.spyOn(ComplianceService, "verifySireReproducibility").mockResolvedValue({
			period: "2026-02",
			companyId: "cmp_1",
			reproducible: false,
			coverage: "PARTIAL_DATA",
			sire: { recordCount: 10, totalAmount: 100, totalIGV: 18 },
			ledger: { recordCount: 9, totalAmount: 99, totalIGV: 17.82 },
			differences: { recordCount: 1, totalAmount: 1, totalIGV: 0.18 },
			tolerances: { recordCount: 0, totalAmount: 0.01, totalIGV: 0.01 },
			runbookId: "RB-SIRE-LEDGER-REPRO-2026-02",
		});
		vi.spyOn(FiscalIndicatorsService, "getTaxCalendar").mockResolvedValue({
			period: "2026-02",
			obligations: [
				{
					code: "SIRE",
					name: "Registro de Ventas e Ingresos (RVIE)",
					period: "2026-02",
					dueDate: "2026-03-10",
					status: "PENDING",
				},
			],
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/sire/dashboard?companyId=cmp_1&period=2026-02&isPrico=true",
				{
					headers: createSireAuthHeaders("cmp_1", jwtSecret),
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				period: "2026-02",
				submission: {
					mode: expect.stringMatching(/api|simulation/),
					policy: {
						isDeferred: true,
						postponedUntil: "2026-06-01",
					},
				},
				reproducibility: {
					runbookId: "RB-SIRE-LEDGER-REPRO-2026-02",
				},
			},
		});
	});

	it("returns 500 envelope when dashboard fails", async () => {
		process.env.SIRE_JWT_SECRET = jwtSecret;
		vi.spyOn(ComplianceService, "getDashboard").mockRejectedValue(
			new Error("Unexpected"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/sire/dashboard?companyId=cmp_1&period=2026-02",
				{
					headers: createSireAuthHeaders("cmp_1", jwtSecret),
				},
			),
		);

		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SIRE_DASHBOARD_ERROR",
		});
	});
});
