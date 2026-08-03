/**
 * Mission memory recorder — unit tests.
 *
 * No monetary fields exist in the mission/observation model; Drenyra money
 * values are BigInt cents (repo-wide rule) and nothing here touches them.
 */

import type { EngramClient, EngramSaveInput } from "@drenyra/memory";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMissionMemoryRecorder,
	EngramMissionMemoryRecorder,
	NoopMissionMemoryRecorder,
	normalizeEngramPeriod,
} from "../mission-memory.recorder";

vi.mock(
	"@drenyra/persistence/repositories/support/organization-resolver",
	() => ({
		resolveCompanyRuc: vi.fn(),
		tryResolveOrganizationIdFromCompany: vi.fn(),
	}),
);

import {
	resolveCompanyRuc,
	tryResolveOrganizationIdFromCompany,
} from "@drenyra/persistence/repositories/support/organization-resolver";

const RUC = "20123456789";
const companyId = "550e8400-e29b-41d4-a716-446655440000";
const missionId = "550e8400-e29b-41d4-a716-446655440001";

const INPUT = {
	missionId,
	companyId,
	intent: "monthly-close",
	fiscalPeriod: "2026-07",
	reason: "Reconciled by evidence",
	actorId: "alice",
};

function makeClient() {
	return {
		save: vi.fn().mockResolvedValue({
			observation: { identity: { id: "obs-1" } },
			outcome: "created",
		}),
	} as unknown as EngramClient;
}

describe("normalizeEngramPeriod", () => {
	it("converts YYYY-MM to YYYYMM", () => {
		expect(normalizeEngramPeriod("2026-07")).toBe("202607");
	});
	it("passes YYYYMM through", () => {
		expect(normalizeEngramPeriod("202607")).toBe("202607");
	});
	it("fails closed on malformed periods", () => {
		expect(() => normalizeEngramPeriod("2026")).toThrow(/INVALID_PERIOD/);
		expect(() => normalizeEngramPeriod("not-a-period")).toThrow(
			/INVALID_PERIOD/,
		);
	});
});

describe("EngramMissionMemoryRecorder", () => {
	let client: ReturnType<typeof makeClient>;
	let recorder: EngramMissionMemoryRecorder;

	beforeEach(() => {
		vi.clearAllMocks();
		client = makeClient();
		recorder = new EngramMissionMemoryRecorder(client);
		vi.mocked(resolveCompanyRuc).mockResolvedValue(RUC);
		vi.mocked(tryResolveOrganizationIdFromCompany).mockResolvedValue(42);
	});

	it("records a PERIOD-LESS mission_result (observability visibility)", async () => {
		// The observation must be company-level period-less memory: the
		// observability surface reads GET /v1/context WITHOUT a period, and the
		// engine's exact-scope rule means a perioded observation would be
		// invisible to it. The fiscal period travels in content (searchable).
		await recorder.recordCompletion(INPUT);

		expect(client.save).toHaveBeenCalledTimes(1);
		const saved = client.save.mock.calls[0][0] as EngramSaveInput;
		expect(saved.topicKey).toBe(`mission/${missionId}`);
		expect(saved.type).toBe("mission_result");
		expect(saved.scope).toEqual({
			kind: "company",
			organizationId: "42",
			companyId: RUC,
			ruc: RUC,
		});
		expect(saved.content.what).toContain("monthly-close");
		expect(saved.content.why).toBe("Reconciled by evidence");
		expect(saved.content.learned).toContain("202607");
		expect(saved.provenance.actor).toBe("alice");
		expect(saved.provenance.session).toBe(missionId);
		expect(saved.provenance.source).toBe("api");
	});

	it("falls back to the api organization id when no organization is mapped", async () => {
		vi.mocked(tryResolveOrganizationIdFromCompany).mockResolvedValue(null);
		await recorder.recordCompletion(INPUT);
		const saved = client.save.mock.calls[0][0] as EngramSaveInput;
		expect(saved.scope.organizationId).toBe("api");
	});

	it("uses system as the actor when none is given", async () => {
		await recorder.recordCompletion({ ...INPUT, actorId: "" });
		const saved = client.save.mock.calls[0][0] as EngramSaveInput;
		expect(saved.provenance.actor).toBe("system");
		expect(saved.content.learned).toContain("system");
	});

	it("propagates resolver/client failures (the caller owns best-effort handling)", async () => {
		vi.mocked(resolveCompanyRuc).mockRejectedValue(
			new Error("Company not found"),
		);
		await expect(recorder.recordCompletion(INPUT)).rejects.toThrow(
			"Company not found",
		);
		expect(client.save).not.toHaveBeenCalled();
	});
});

describe("NoopMissionMemoryRecorder", () => {
	it("does nothing (fail closed when engram is disabled)", async () => {
		const noop = new NoopMissionMemoryRecorder();
		await expect(noop.recordCompletion(INPUT)).resolves.toBeUndefined();
	});
});

describe("createMissionMemoryRecorder", () => {
	it("returns the noop recorder when engram is disabled (fail closed)", () => {
		vi.stubEnv("DRENYRA_ENGRAM_ENABLED", "false");
		const recorder = createMissionMemoryRecorder();
		expect(recorder).toBeInstanceOf(NoopMissionMemoryRecorder);
		vi.unstubAllEnvs();
	});
});
