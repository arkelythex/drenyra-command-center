/**
 * FiscalMemoryRoutes — unit tests.
 *
 * Covers the read side of the fiscal-memory loop ("Consultar"): fail-closed
 * when the engram adapter is off, company-scoped reads, filters
 * (period/category/severity/evidenceRef), 404 on missing id, and a typed 503
 * DEPENDENCY_FAILURE when the sidecar is unreachable (never an unhandled
 * crash).
 *
 * No monetary fields: Drenyra money values are BigInt cents (repo-wide rule);
 * fiscal memories carry no money values.
 */

import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	isEngramEnabled: vi.fn(),
	context: vi.fn(),
	findById: vi.fn(),
	resolveCompanyRuc: vi.fn(),
	tryResolveOrganizationIdFromCompany: vi.fn(),
	EngramError: class EngramError extends Error {
		kind = "network";
		constructor(kind: string, message: string) {
			super(message);
			this.kind = kind;
		}
	},
}));

vi.mock("@drenyra/memory", () => ({
	isEngramEnabled: mocks.isEngramEnabled,
	EngramError: mocks.EngramError,
	EngramClient: class {
		context = mocks.context;
	},
	EngramFiscalMemoryRepository: class {
		findById = mocks.findById;
	},
	engramConfig: () => ({ baseUrl: "http://localhost:8733", enabled: true }),
	observationToFiscalMemory: (observation: {
		type?: string;
		learned?: string;
		content?: { what?: string; why?: string; where?: string };
		provenance?: { actor?: string; timestamp?: string };
		title?: string;
	}) => {
		if (observation.type !== "fiscal_memory") {
			throw new Error("not fiscal memory");
		}
		const learned = JSON.parse(observation.learned ?? "{}") as {
			id?: string;
			period?: string;
			category?: string;
			severity?: string;
			status?: string;
			companyId?: string;
		};
		return {
			id: learned.id ?? "mem-1",
			tenantId: "api",
			companyId: learned.companyId ?? "20123456789",
			ruc: learned.companyId ?? "20123456789",
			period: learned.period ?? "2026-07",
			category: learned.category ?? "monthly_closing",
			severity: learned.severity ?? "medium",
			status: learned.status ?? "active",
			title: observation.title ?? "Monthly close 2026-07",
			summary: observation.content?.what ?? "",
			evidenceRefs: (observation.content?.where ?? "")
				.split("\n")
				.filter((line) => line.length > 0),
			tags: [],
			createdBy: "user-1",
			sourceAgentId: "mission-1",
			relatedMemoryIds: [],
			createdAt: new Date(
				observation.provenance?.timestamp ?? "2026-08-01T00:00:00Z",
			),
			toJSON() {
				return {
					id: this.id,
					tenantId: this.tenantId,
					companyId: this.companyId,
					ruc: this.ruc,
					period: this.period,
					category: this.category,
					severity: this.severity,
					status: this.status,
					title: this.title,
					summary: this.summary,
					evidenceRefs: [...this.evidenceRefs],
					tags: [...this.tags],
					createdBy: this.createdBy,
					sourceAgentId: this.sourceAgentId,
					relatedMemoryIds: [],
					createdAt: this.createdAt,
				};
			},
		};
	},
}));

vi.mock(
	"@drenyra/persistence/repositories/support/organization-resolver",
	() => ({
		resolveCompanyRuc: mocks.resolveCompanyRuc,
		tryResolveOrganizationIdFromCompany:
			mocks.tryResolveOrganizationIdFromCompany,
	}),
);

import { fiscalMemoryRoutes } from "../fiscal-memory.routes";

const app = new Elysia().use(fiscalMemoryRoutes);

const COMPANY = "550e8400-e29b-41d4-a716-446655440000";
const RUC = "20123456789";

const fiscalHeaders = {
	"x-user-id": "user-1",
	"x-user-role": "admin",
	"x-company-id": COMPANY,
};

function observation(
	overrides: {
		id?: string;
		period?: string;
		category?: string;
		severity?: string;
		evidence?: string[];
	} = {},
) {
	const {
		id = "mem-1",
		period = "2026-07",
		category = "monthly_closing",
		severity = "medium",
		evidence = ["evidence/inv-1"],
	} = overrides;
	const evidenceRefs = [...evidence];
	return {
		type: "fiscal_memory",
		title: `Monthly close ${period}`,
		learned: JSON.stringify({
			id,
			period,
			category,
			severity,
			status: "active",
			companyId: RUC,
		}),
		content: {
			what: `Approved proposal ${id}`,
			why: "Approved",
			where: evidence.join("\n"),
		},
		provenance: { actor: "user-1", timestamp: "2026-08-01T00:00:00Z" },
		// Serialized domain shape (mirrors FiscalMemory.toJSON) — the repository
		// returns a FiscalMemory aggregate; findById is mocked at that level.
		toJSON() {
			return {
				id,
				tenantId: "7",
				companyId: RUC,
				ruc: RUC,
				period,
				category,
				severity,
				status: "active",
				title: `Monthly close ${period}`,
				summary: `Approved proposal ${id}`,
				evidenceRefs: [...evidenceRefs],
				tags: [],
				createdBy: "user-1",
				sourceAgentId: "mission-1",
				relatedMemoryIds: [],
				createdAt: "2026-08-01T00:00:00Z",
			};
		},
	};
}

describe("fiscalMemoryRoutes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.resolveCompanyRuc.mockResolvedValue(RUC);
		mocks.tryResolveOrganizationIdFromCompany.mockResolvedValue(7);
	});

	it("fails closed with 503 when the engram adapter is disabled", async () => {
		mocks.isEngramEnabled.mockReturnValue(false);

		const response = await app.handle(
			new Request("http://localhost/api/v1/fiscal-memory", {
				headers: fiscalHeaders,
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(503);
		expect(body).toMatchObject({
			success: false,
			error: { code: "FISCAL_MEMORY_DISABLED" },
		});
		expect(mocks.context).not.toHaveBeenCalled();
	});

	it("lists fiscal memories scoped to the company RUC", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([observation()]);

		const response = await app.handle(
			new Request("http://localhost/api/v1/fiscal-memory", {
				headers: fiscalHeaders,
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data).toHaveLength(1);
		expect(body.data[0]).toMatchObject({
			ruc: RUC,
			period: "2026-07",
			category: "monthly_closing",
		});
		// Scope enforced: the context read carries the resolved RUC + tenant.
		expect(mocks.context).toHaveBeenCalledWith({
			ruc: RUC,
			organizationId: "7",
		});
	});

	it("filters by period", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([
			observation({ id: "mem-1", period: "2026-07" }),
			observation({ id: "mem-2", period: "2026-06" }),
		]);

		const response = await app.handle(
			new Request("http://localhost/api/v1/fiscal-memory?period=2026-07", {
				headers: fiscalHeaders,
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data.map((m: { id: string }) => m.id)).toEqual(["mem-1"]);
	});

	it("filters by category and severity", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([
			observation({
				id: "mem-1",
				category: "monthly_closing",
				severity: "high",
			}),
			observation({ id: "mem-2", category: "tax_decision", severity: "high" }),
			observation({
				id: "mem-3",
				category: "monthly_closing",
				severity: "low",
			}),
		]);

		const response = await app.handle(
			new Request(
				"http://localhost/api/v1/fiscal-memory?category=monthly_closing&severity=high",
				{ headers: fiscalHeaders },
			),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data.map((m: { id: string }) => m.id)).toEqual(["mem-1"]);
	});

	it("filters by evidenceRef", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([
			observation({ id: "mem-1", evidence: ["evidence/inv-1"] }),
			observation({ id: "mem-2", evidence: ["evidence/inv-2"] }),
		]);

		const response = await app.handle(
			new Request(
				"http://localhost/api/v1/fiscal-memory?evidenceRef=evidence/inv-2",
				{ headers: fiscalHeaders },
			),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data.map((m: { id: string }) => m.id)).toEqual(["mem-2"]);
	});

	it("rejects an invalid category with 422", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);

		const response = await app.handle(
			new Request(
				"http://localhost/api/v1/fiscal-memory?category=not_a_category",
				{ headers: fiscalHeaders },
			),
		);

		expect(response.status).toBe(422);
	});

	it("returns 404 when the memory id is not found in scope", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);
		mocks.findById.mockResolvedValue(null);

		const response = await app.handle(
			new Request("http://localhost/api/v1/fiscal-memory/mem-missing", {
				headers: fiscalHeaders,
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toMatchObject({
			success: false,
			error: { code: "NOT_FOUND" },
		});
		// findById is always scoped.
		expect(mocks.findById).toHaveBeenCalledWith("mem-missing", {
			tenantId: "7",
			companyId: RUC,
			ruc: RUC,
		});
	});

	it("returns the memory by id with its serialized shape", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);
		mocks.findById.mockResolvedValue(observation({ id: "mem-1" }));

		const response = await app.handle(
			new Request("http://localhost/api/v1/fiscal-memory/mem-1", {
				headers: fiscalHeaders,
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data.id).toBe("mem-1");
		expect(body.data.evidenceRefs).toEqual(["evidence/inv-1"]);
	});

	it("answers 503 DEPENDENCY_FAILURE when the sidecar is unreachable (no crash)", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);
		mocks.context.mockRejectedValue(
			new mocks.EngramError("network", "sidecar down"),
		);

		const response = await app.handle(
			new Request("http://localhost/api/v1/fiscal-memory", {
				headers: fiscalHeaders,
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(503);
		expect(body).toMatchObject({
			success: false,
			error: { code: "DEPENDENCY_FAILURE" },
		});
	});

	it("requires company scope (401) without it", async () => {
		mocks.isEngramEnabled.mockReturnValue(true);

		const response = await app.handle(
			new Request("http://localhost/api/v1/fiscal-memory"),
		);

		expect(response.status).toBe(401);
	});
});
