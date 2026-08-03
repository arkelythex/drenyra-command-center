/**
 * FiscalMemoryQueryService — unit tests (PR #1: read engine).
 *
 * Tests the query service against a mocked engram client and a fake scope
 * resolver — no HTTP surface. Covers: fail-closed factory, company-scoped
 * reads, filters (period/category/severity/evidenceRef), findById scope
 * enforcement, and skipping corrupt/non-fiscal observations.
 *
 * No monetary fields: Drenyra money values are BigInt cents (repo-wide rule);
 * fiscal memories carry no money values.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	isEngramEnabled: vi.fn(),
	context: vi.fn(),
	findById: vi.fn(),
}));

vi.mock("@drenyra/memory", () => ({
	isEngramEnabled: mocks.isEngramEnabled,
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
		};
	},
}));

import type { FiscalMemoryScope } from "@drenyra/domain/fiscal-memory";
import {
	createFiscalMemoryQueryService,
	DisabledFiscalMemoryQueryService,
	EngramFiscalMemoryQueryService,
} from "../fiscal-memory.query";

const RUC = "20123456789";
const COMPANY = "550e8400-e29b-41d4-a716-446655440000";
const SCOPE: FiscalMemoryScope = {
	tenantId: "7",
	companyId: RUC,
	ruc: RUC,
};

const fakeResolver = {
	resolve: vi.fn().mockResolvedValue(SCOPE),
};

function observation(
	overrides: {
		id?: string;
		period?: string;
		category?: string;
		severity?: string;
		evidence?: string[];
		corrupt?: boolean;
	} = {},
) {
	const {
		id = "mem-1",
		period = "2026-07",
		category = "monthly_closing",
		severity = "medium",
		evidence = ["evidence/inv-1"],
		corrupt = false,
	} = overrides;
	if (corrupt) {
		return { type: "fiscal_memory", learned: "not-json", title: "corrupt" };
	}
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
	};
}

describe("EngramFiscalMemoryQueryService", () => {
	let service: EngramFiscalMemoryQueryService;

	beforeEach(() => {
		vi.clearAllMocks();
		fakeResolver.resolve.mockResolvedValue(SCOPE);
		service = new EngramFiscalMemoryQueryService(
			{ context: mocks.context } as never,
			fakeResolver as never,
		);
	});

	it("reads the company scope chain (RUC + tenant) for every list", async () => {
		mocks.context.mockResolvedValue([observation()]);

		await service.list(COMPANY, {});

		expect(fakeResolver.resolve).toHaveBeenCalledWith(COMPANY);
		expect(mocks.context).toHaveBeenCalledWith({
			ruc: RUC,
			organizationId: "7",
		});
	});

	it("returns all fiscal memories when no filters are given", async () => {
		mocks.context.mockResolvedValue([
			observation({ id: "mem-1" }),
			observation({ id: "mem-2", period: "2026-06" }),
		]);

		const result = await service.list(COMPANY, {});

		expect(result.disabled).toBe(false);
		if (!result.disabled) {
			expect(result.memories.map((m) => m.id)).toEqual(["mem-1", "mem-2"]);
		}
	});

	it("filters by period", async () => {
		mocks.context.mockResolvedValue([
			observation({ id: "mem-1", period: "2026-07" }),
			observation({ id: "mem-2", period: "2026-06" }),
		]);

		const result = await service.list(COMPANY, { period: "2026-07" });

		expect(result.disabled).toBe(false);
		if (!result.disabled) {
			expect(result.memories.map((m) => m.id)).toEqual(["mem-1"]);
		}
	});

	it("filters by category and severity together", async () => {
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

		const result = await service.list(COMPANY, {
			category: "monthly_closing",
			severity: "high",
		});

		expect(result.disabled).toBe(false);
		if (!result.disabled) {
			expect(result.memories.map((m) => m.id)).toEqual(["mem-1"]);
		}
	});

	it("filters by evidenceRef", async () => {
		mocks.context.mockResolvedValue([
			observation({ id: "mem-1", evidence: ["evidence/inv-1"] }),
			observation({ id: "mem-2", evidence: ["evidence/inv-2"] }),
		]);

		const result = await service.list(COMPANY, {
			evidenceRef: "evidence/inv-2",
		});

		expect(result.disabled).toBe(false);
		if (!result.disabled) {
			expect(result.memories.map((m) => m.id)).toEqual(["mem-2"]);
		}
	});

	it("skips corrupt and non-fiscal observations without crashing", async () => {
		mocks.context.mockResolvedValue([
			observation({ id: "mem-1" }),
			observation({ corrupt: true }),
			{ type: "mission_result", title: "not fiscal" },
		]);

		const result = await service.list(COMPANY, {});

		expect(result.disabled).toBe(false);
		if (!result.disabled) {
			expect(result.memories.map((m) => m.id)).toEqual(["mem-1"]);
		}
	});

	it("findById delegates to the repository with the company scope", async () => {
		mocks.findById.mockResolvedValue({ id: "mem-1" });

		const result = await service.findById(COMPANY, "mem-1");

		expect(result.disabled).toBe(false);
		expect(mocks.findById).toHaveBeenCalledWith("mem-1", SCOPE);
		if (!result.disabled) {
			expect(result.memory?.id).toBe("mem-1");
		}
	});

	it("findById surfaces null when the memory is not in scope", async () => {
		mocks.findById.mockResolvedValue(null);

		const result = await service.findById(COMPANY, "mem-missing");

		expect(result.disabled).toBe(false);
		if (!result.disabled) {
			expect(result.memory).toBeNull();
		}
	});
});

describe("createFiscalMemoryQueryService factory", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns a Disabled service when engram is off (fail closed)", () => {
		mocks.isEngramEnabled.mockReturnValue(false);

		const service = createFiscalMemoryQueryService(fakeResolver as never);

		expect(service).toBeInstanceOf(DisabledFiscalMemoryQueryService);
	});

	it("returns the Engram-backed service when engram is on", () => {
		mocks.isEngramEnabled.mockReturnValue(true);

		const service = createFiscalMemoryQueryService(fakeResolver as never);

		expect(service).toBeInstanceOf(EngramFiscalMemoryQueryService);
	});

	it("Disabled service answers disabled without touching the sidecar", async () => {
		const service = new DisabledFiscalMemoryQueryService();

		const list = await service.list(COMPANY, {});
		const byId = await service.findById(COMPANY, "mem-1");

		expect(list.disabled).toBe(true);
		expect(byId.disabled).toBe(true);
		expect(mocks.context).not.toHaveBeenCalled();
		expect(mocks.findById).not.toHaveBeenCalled();
	});
});
