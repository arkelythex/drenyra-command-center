/**
 * Observability service engram-path unit tests.
 *
 * Covers: engram-enabled reads map observations into the existing response
 * shapes; disabled reads fall back to Postgres; engram failures fall back
 * with a warning. Postgres is stubbed to return empty results — no real DB.
 *
 * No monetary fields exist in this module; Drenyra money values are BigInt
 * cents (repo-wide rule) and nothing here touches them.
 */

import type { EngramObservation } from "@drenyra/memory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiObservabilityService } from "../../observability/observability.service";

const mocks = vi.hoisted(() => ({
	context: vi.fn(),
	search: vi.fn(),
	isEnabled: vi.fn(),
	resolveCompanyRuc: vi.fn(),
	tryResolveOrganizationIdFromCompany: vi.fn(),
}));

vi.mock("@drenyra/memory", () => ({
	EngramClient: class {
		context = mocks.context;
		search = mocks.search;
	},
	engramConfig: () => ({
		baseUrl: "http://engram.test:8733",
		enabled: true,
		timeoutMs: 5000,
	}),
	isEngramEnabled: () => mocks.isEnabled(),
}));

vi.mock(
	"@drenyra/persistence/repositories/support/organization-resolver",
	() => ({
		resolveCompanyRuc: mocks.resolveCompanyRuc,
		tryResolveOrganizationIdFromCompany:
			mocks.tryResolveOrganizationIdFromCompany,
	}),
);

interface EmptyQueryChain {
	then(onFulfilled: (rows: unknown[]) => void): void;
	orderBy(): EmptyQueryChain;
	limit(): EmptyQueryChain;
	offset(): EmptyQueryChain;
	where(): EmptyQueryChain;
	from(): EmptyQueryChain;
	select(): EmptyQueryChain;
}

vi.mock("@drenyra/persistence/client", () => {
	let empty: EmptyQueryChain;
	empty = {
		// biome-ignore lint/suspicious/noThenProperty: intentional thenable replicating drizzle's query-builder chain (await db.select()...).
		then: (onFulfilled: (rows: unknown[]) => void) => onFulfilled([]),
		orderBy: () => empty,
		limit: () => empty,
		offset: () => empty,
		where: () => empty,
		from: () => empty,
		select: () => empty,
	};
	return { db: { select: () => empty } };
});

const RUC = "20123456789";
const TS = "2026-01-15T10:00:00.000Z";

function makeObservation(
	overrides: Partial<EngramObservation> = {},
): EngramObservation {
	return {
		identity: { id: "obs-1", topicKey: "run-1" },
		title: "agent_run",
		type: "agent_run",
		scope: {
			kind: "company",
			organizationId: "42",
			companyId: RUC,
			ruc: RUC,
			period: "",
		},
		content: { what: "what", why: "why", where: "where", learned: "learned" },
		authorityStatus: "promoted",
		provenance: {
			actor: "analysis",
			timestamp: TS,
			source: "drenyra-memory",
			session: "run-1",
		},
		revision: 1,
		...overrides,
	};
}

describe("AiObservabilityService — engram memory reads", () => {
	beforeEach(() => {
		mocks.isEnabled.mockReset();
		mocks.context.mockReset();
		mocks.search.mockReset();
		mocks.resolveCompanyRuc.mockReset();
		mocks.tryResolveOrganizationIdFromCompany.mockReset();
		mocks.tryResolveOrganizationIdFromCompany.mockResolvedValue(42);
		mocks.resolveCompanyRuc.mockResolvedValue(RUC);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("getCompanyMemory maps engram observations into the memory shape", async () => {
		mocks.isEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([
			makeObservation({
				content: { what: "w", why: "", where: "", learned: "L1" },
			}),
			makeObservation({
				identity: { id: "obs-2", topicKey: "run-2" },
				content: { what: "W2", why: "", where: "", learned: "" },
			}),
		]);

		const result = await AiObservabilityService.getCompanyMemory("company-1");

		expect(result).toEqual({
			summary: "L1\n\nW2",
			recentRuns: 2,
			companyId: "company-1",
		});
		expect(mocks.context).toHaveBeenCalledWith({
			ruc: RUC,
			organizationId: "42",
		});
	});

	it("getCompanyMemory returns null summary when observations have no content", async () => {
		mocks.isEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([
			makeObservation({
				content: { what: "", why: "", where: "", learned: "" },
			}),
		]);

		const result = await AiObservabilityService.getCompanyMemory("company-1");

		expect(result).toEqual({
			summary: null,
			recentRuns: 1,
			companyId: "company-1",
		});
	});

	it("getMemoryHistory maps observations into history entries, sorted chronologically", async () => {
		mocks.isEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([
			makeObservation({
				identity: { id: "obs-2", topicKey: "run-2" },
				provenance: {
					actor: "analysis",
					timestamp: "2026-01-20T10:00:00.000Z",
					source: "drenyra-memory",
					session: "run-2",
				},
				content: { what: "w2", why: "", where: "", learned: "mem-2" },
			}),
			makeObservation({
				identity: { id: "obs-1", topicKey: "run-1" },
				provenance: {
					actor: "analysis",
					timestamp: TS,
					source: "drenyra-memory",
					session: "run-1",
				},
				content: { what: "w1", why: "", where: "", learned: "mem-1" },
			}),
		]);

		const history = await AiObservabilityService.getMemoryHistory("company-1");

		expect(history.map((entry) => entry.runId)).toEqual(["run-1", "run-2"]);
		expect(history[0]).toEqual({
			runId: "run-1",
			memorySummary: "mem-1",
			workflowState: "agent_run",
			status: "completed",
			startedAt: TS,
			completedAt: TS,
		});
	});

	it("falls back to Postgres when engram is disabled", async () => {
		mocks.isEnabled.mockReturnValue(false);

		const memory = await AiObservabilityService.getCompanyMemory("company-1");
		const history = await AiObservabilityService.getMemoryHistory("company-1");

		expect(mocks.context).not.toHaveBeenCalled();
		expect(memory).toEqual({
			summary: null,
			recentRuns: 0,
			companyId: "company-1",
		});
		expect(history).toEqual([]);
	});

	it("falls back to Postgres with a warning when the engram read fails", async () => {
		mocks.isEnabled.mockReturnValue(true);
		mocks.context.mockRejectedValue(new Error("ENGINE_UNREACHABLE: boom"));
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const memory = await AiObservabilityService.getCompanyMemory("company-1");
		const history = await AiObservabilityService.getMemoryHistory("company-1");

		expect(memory).toEqual({
			summary: null,
			recentRuns: 0,
			companyId: "company-1",
		});
		expect(history).toEqual([]);
		expect(warn).toHaveBeenCalledTimes(2);
		const [first] = warn.mock.calls[0] ?? [];
		expect(String(first)).toContain("[engram]");
		expect(String(first)).toContain("ENGINE_UNREACHABLE");
	});

	it("falls back with a warning when the ruc resolution fails", async () => {
		mocks.isEnabled.mockReturnValue(true);
		mocks.resolveCompanyRuc.mockRejectedValue(
			new Error("Company nope not found"),
		);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const memory = await AiObservabilityService.getCompanyMemory("company-1");

		expect(memory).toEqual({
			summary: null,
			recentRuns: 0,
			companyId: "company-1",
		});
		expect(warn).toHaveBeenCalledTimes(1);
		expect(mocks.context).not.toHaveBeenCalled();
	});

	it("does not warn on the happy engram path", async () => {
		mocks.isEnabled.mockReturnValue(true);
		mocks.context.mockResolvedValue([makeObservation()]);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await AiObservabilityService.getCompanyMemory("company-1");

		expect(warn).not.toHaveBeenCalled();
	});
});
