import { createHash } from "node:crypto";
import { Elysia } from "elysia";
import { afterEach, describe, expect, it } from "vitest";
import { interCompanyRoutes as interCompanyModule } from "../../index";
import {
	cleanupInterCompanyAuditFixture,
	createInterCompanyAuditFixture,
	type InterCompanyAuditFixture,
} from "./inter-company-audit.fixtures";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("inter-company audit routes (integration)", () => {
	const app = new Elysia().use(interCompanyModule);
	const fixtures: InterCompanyAuditFixture[] = [];

	afterEach(async () => {
		for (const fixture of fixtures.splice(0)) {
			await cleanupInterCompanyAuditFixture(fixture);
		}
	});

	it("filters date range using Lima civil-day boundaries", async () => {
		const fixture = await createInterCompanyAuditFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/inter-company/audit?economicGroupId=${fixture.economicGroupId}&dateFrom=2026-01-01&dateTo=2026-01-01&sortBy=createdAt&sortDir=asc`,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({ success: true });

		const items = (payload.data.items as Array<{ id: string }>).map(
			(row) => row.id,
		);
		expect(items).toContain(fixture.txAtStartId);
		expect(items).not.toContain(fixture.txBeforeStartId);
	});

	it("returns CSV audit with deterministic fingerprint/hash headers", async () => {
		const fixture = await createInterCompanyAuditFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/inter-company/audit?economicGroupId=${fixture.economicGroupId}&dateFrom=2026-01-01&dateTo=2026-01-01&sortBy=createdAt&sortDir=asc&format=csv`,
			),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/csv");

		const expectedFingerprint = createHash("sha256")
			.update(
				JSON.stringify({
					economicGroupId: fixture.economicGroupId,
					detractionProfile: null,
					detractionRuleCode: null,
					dateFrom: "2026-01-01",
					dateTo: "2026-01-01",
					limit: null,
					offset: null,
					sortBy: "createdAt",
					sortDir: "asc",
				}),
				"utf8",
			)
			.digest("hex");

		expect(response.headers.get("x-audit-query-fingerprint")).toBe(
			expectedFingerprint,
		);
		expect(response.headers.get("x-audit-row-count")).toBe("3");

		const body = await response.text();
		expect(body).toContain(fixture.txAtStartId);
		expect(body).toContain(fixture.txTieAId);
		expect(body).toContain(fixture.txTieBId);
		expect(body).not.toContain(fixture.txBeforeStartId);

		const headerHash = response.headers.get("x-audit-content-sha256");
		const expectedHashWithoutBom = createHash("sha256")
			.update(body, "utf8")
			.digest("hex");
		const expectedHashWithBom = createHash("sha256")
			.update(`\uFEFF${body}`, "utf8")
			.digest("hex");
		expect([expectedHashWithoutBom, expectedHashWithBom]).toContain(headerHash);
	});

	it("orders ties deterministically by id when sortBy field is equal", async () => {
		const fixture = await createInterCompanyAuditFixture();
		fixtures.push(fixture);

		const response = await app.handle(
			new Request(
				`http://localhost/api/inter-company/audit?economicGroupId=${fixture.economicGroupId}&dateFrom=2026-01-01&dateTo=2026-01-01&sortBy=amount&sortDir=asc`,
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({ success: true });

		const items = payload.data.items as Array<{ id: string; amount: string }>;
		const tieIds = items
			.filter((row) => row.amount === "150.00")
			.map((row) => row.id);
		const expectedTieOrder = [fixture.txTieAId, fixture.txTieBId].sort();

		expect(tieIds).toEqual(expectedTieOrder);
	});
});
