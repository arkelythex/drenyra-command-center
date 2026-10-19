import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeHash } from "../domain";

const getTrail = vi.fn();

vi.mock("../infrastructure/repository", () => ({
	AgentDecisionLogRepository: class {
		getTrail = getTrail;
	},
}));

import { verifyHashChain } from "../application/queries/verify-chain.query";

interface FakeLog {
	id: string;
	createdAt: Date;
	decisionData: { inputs: unknown; outputs: unknown };
	hashChain: { prevHash: string | null; hash: string };
}

async function link(
	id: string,
	prevHash: string | null,
	inputs: unknown = { n: id },
): Promise<FakeLog> {
	const createdAt = new Date("2026-01-01T00:00:00.000Z");
	const outputs = { ok: true };
	const hash = await computeHash({ id, createdAt, inputs, outputs, prevHash });
	return {
		id,
		createdAt,
		decisionData: { inputs, outputs },
		hashChain: { prevHash, hash },
	};
}

async function chain(n: number): Promise<FakeLog[]> {
	const logs: FakeLog[] = [];
	let prev: string | null = null;
	for (let i = 0; i < n; i++) {
		const l = await link(`log-${i}`, prev);
		logs.push(l);
		prev = l.hashChain.hash;
	}
	return logs;
}

const FILTERS = { companyId: "c1" } as never;

describe("verifyHashChain", () => {
	beforeEach(() => getTrail.mockReset());

	it("accepts an empty trail", async () => {
		getTrail.mockResolvedValue([]);
		expect(await verifyHashChain(FILTERS)).toEqual({ isValid: true });
	});

	it("asks the repository for at most 1000 logs, keeping the filters", async () => {
		getTrail.mockResolvedValue([]);
		await verifyHashChain(FILTERS);
		expect(getTrail).toHaveBeenCalledWith({ companyId: "c1", limit: 1000 });
	});

	it("accepts an intact chain", async () => {
		getTrail.mockResolvedValue(await chain(4));
		expect(await verifyHashChain(FILTERS)).toEqual({ isValid: true });
	});

	it("reports the first log whose payload was tampered with", async () => {
		const logs = await chain(4);
		logs[2]!.decisionData.inputs = { n: "forged" };
		getTrail.mockResolvedValue(logs);
		expect(await verifyHashChain(FILTERS)).toEqual({
			isValid: false,
			brokenAt: 2,
			error: "Hash mismatch at log #2 (log-2)",
		});
	});

	it("reports a broken link when prevHash does not match the previous hash", async () => {
		const logs = await chain(3);
		// Re-seal log 2 over a forged prevHash so its own hash is consistent.
		logs[2] = await link("log-2", "f".repeat(64));
		getTrail.mockResolvedValue(logs);
		expect(await verifyHashChain(FILTERS)).toEqual({
			isValid: false,
			brokenAt: 2,
			error: "Chain broken at log #2 (prevHash mismatch)",
		});
	});

	it("does not check a link for the first log, only its own hash", async () => {
		const first = await link("log-0", "some-older-hash");
		getTrail.mockResolvedValue([first]);
		expect(await verifyHashChain(FILTERS)).toEqual({ isValid: true });
	});

	it("reports the earliest problem when several exist", async () => {
		const logs = await chain(4);
		logs[1]!.decisionData.outputs = { ok: false };
		logs[3]!.decisionData.outputs = { ok: false };
		getTrail.mockResolvedValue(logs);
		const result = await verifyHashChain(FILTERS);
		expect(result.brokenAt).toBe(1);
	});
});
