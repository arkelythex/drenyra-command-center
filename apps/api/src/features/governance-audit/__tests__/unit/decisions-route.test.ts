import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactEventQueryService } from "../../artifact-event-query.service";
import { GovernanceAuditService } from "../../governance-audit.service";
import { governanceAuditModule } from "../../index";

vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

describe("governance audit route", () => {
	const app = new Elysia().use(governanceAuditModule);
	const authHeaders = {
		"x-auth-user-id": "auth-user-1",
		"x-user-id": "11111111-1111-1111-1111-111111111111",
		"x-user-role": "admin",
		"x-company-id": "cmp-1",
	};

	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "test-company",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns decisions envelope", async () => {
		const spy = vi
			.spyOn(GovernanceAuditService, "listDecisions")
			.mockResolvedValue({
				items: [
					{
						feature: "sire",
						entityType: "sire_submission",
						entityId: "sub-1",
						decision: "BLOCK",
						action: "sire_submit",
						reason: "Global kill switch active",
						timestamp: "2026-02-13T00:00:00.000Z",
						source: "sire_submissions",
					},
				],
				total: 1,
				limit: 50,
				offset: 0,
			});

		const response = await app.handle(
			new Request(
				"http://localhost/api/governance-audit/decisions?companyId=cmp-1",
				{
					headers: authHeaders,
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				total: 1,
				items: [{ decision: "BLOCK", feature: "sire" }],
				access: {
					userId: "auth-user-1",
					role: "admin",
					companyId: "cmp-1",
				},
			},
		});
		expect(spy).toHaveBeenCalledWith({ companyId: "cmp-1" });
	});

	it("passes query filters to service", async () => {
		const spy = vi
			.spyOn(GovernanceAuditService, "listDecisions")
			.mockResolvedValue({
				items: [],
				total: 0,
				limit: 20,
				offset: 10,
			});

		const response = await app.handle(
			new Request(
				"http://localhost/api/governance-audit/decisions?companyId=cmp-1&feature=sire&decision=ALLOW&limit=20&offset=10",
				{ headers: authHeaders },
			),
		);

		expect(response.status).toBe(200);
		expect(spy).toHaveBeenCalledWith({
			companyId: "cmp-1",
			feature: "sire",
			decision: "ALLOW",
			limit: 20,
			offset: 10,
		});
	});

	it("returns 401 when auth headers are missing", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/governance-audit/decisions?companyId=cmp-1",
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "AUTH_REQUIRED",
		});
	});

	it("returns 403 when tenant scope does not match header company", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/governance-audit/decisions?companyId=cmp-x",
				{
					headers: authHeaders,
				},
			),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "TENANT_SCOPE_VIOLATION",
		});
	});

	it("returns 500 envelope when service throws", async () => {
		vi.spyOn(GovernanceAuditService, "listDecisions").mockRejectedValue(
			new Error("DB unavailable"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/governance-audit/decisions?companyId=cmp-1",
				{
					headers: authHeaders,
				},
			),
		);

		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "GOVERNANCE_AUDIT_ERROR",
		});
	});

	it("returns artifact events envelope", async () => {
		const spy = vi.spyOn(ArtifactEventQueryService, "list").mockResolvedValue({
			items: [
				{
					id: "evt-1",
					actorUserId: "user-1",
					companyId: "cmp-1",
					artifactId: "art-1",
					artifactType: "sire.diff.v1",
					traceId: "tr-1",
					actionId: "accept-sunat-batch",
					message: "Se aplico SUNAT",
					createdAt: "2026-02-14T04:00:00.000Z",
					source: "workspace-artifact",
				},
			],
			total: 1,
			limit: 25,
			offset: 0,
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/governance-audit/events?companyId=cmp-1",
				{
					headers: authHeaders,
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				total: 1,
				items: [{ actionId: "accept-sunat-batch", traceId: "tr-1" }],
			},
		});
		expect(spy).toHaveBeenCalledWith({ companyId: "cmp-1" });
	});

	it("returns 500 envelope when artifact event service throws", async () => {
		vi.spyOn(ArtifactEventQueryService, "list").mockRejectedValue(
			new Error("DB unavailable"),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/governance-audit/events?companyId=cmp-1",
				{
					headers: authHeaders,
				},
			),
		);

		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "GOVERNANCE_AUDIT_EVENTS_ERROR",
		});
	});

	it("returns governance metrics with admin role", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/governance-audit/metrics", {
				headers: authHeaders,
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				metric: "drenyra_api_governance_policy_decisions_total",
				values: expect.any(Array),
			},
		});
	});

	it("returns prometheus payload with admin role", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/governance-audit/metrics/prometheus", {
				headers: authHeaders,
			}),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/plain");
		const payload = await response.text();
		expect(payload).toContain(
			"drenyra_api_governance_policy_decisions_total",
		);
	});
});
