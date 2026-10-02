import { computeAuditHash } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import { PostgresFiscalTruthRepository } from "./postgres-fiscal-truth.repository";

const scope = {
	companyId: "c1",
	companyRuc: "20123456789",
	period: "2026-06",
	organizationId: 1,
	countryCode: "PE",
} as never;

/** Drizzle-like client: every select resolves to the next canned result, inserts are recorded. */
function fakeClient(...selects: unknown[][]) {
	const inserted: Array<Record<string, unknown>> = [];
	let call = 0;
	const chain = (rows: unknown[]) => {
		const c: Record<string, unknown> = {};
		for (const m of ["from", "where", "orderBy"]) c[m] = () => c;
		c.limit = () => Promise.resolve(rows);
		// verifyChain / findBy* end at orderBy or limit; make orderBy awaitable too
		c.orderBy = () =>
			Object.assign(Promise.resolve(rows), {
				limit: () => Promise.resolve(rows),
			});
		return c;
	};
	const client = {
		select: () => chain(selects[call++] ?? []),
		insert: () => ({
			values: (v: Record<string, unknown>) => {
				inserted.push(v);
				return Promise.resolve();
			},
		}),
	};
	return { client: client as never, inserted };
}

type Row = {
	eventId: string;
	prevHash: string | null;
	chainHash: string | null;
	occurredAt: Date;
	payload: Record<string, unknown>;
};

async function buildChain(payloads: Record<string, unknown>[]): Promise<Row[]> {
	const rows: Row[] = [];
	let prev: string | null = null;
	for (const [i, payload] of payloads.entries()) {
		const chainHash = await computeAuditHash(payload, prev);
		rows.push({
			eventId: `e${i + 1}`,
			prevHash: prev,
			chainHash,
			occurredAt: new Date(2026, 5, i + 1),
			payload,
		});
		prev = chainHash;
	}
	return rows;
}

const repo = (rows: unknown[]) =>
	new PostgresFiscalTruthRepository(fakeClient(rows).client);

describe("PostgresFiscalTruthRepository.verifyChain", () => {
	it("an empty scope is valid with zero events", async () => {
		expect(await repo([]).verifyChain(scope)).toEqual({
			valid: true,
			count: 0,
			brokenLinks: [],
		});
	});

	it("a correctly linked chain is valid and counts every event", async () => {
		const rows = await buildChain([{ a: 1 }, { b: 2 }, { c: 3 }]);
		expect(await repo(rows).verifyChain(scope)).toEqual({
			valid: true,
			count: 3,
			brokenLinks: [],
		});
	});

	it("detects a tampered payload at the exact index (hash no longer matches)", async () => {
		const rows = await buildChain([{ a: 1 }, { b: 2 }, { c: 3 }]);
		rows[1] = { ...rows[1], payload: { b: 999 } } as Row;
		const result = await repo(rows).verifyChain(scope);
		expect(result.valid).toBe(false);
		expect(result.brokenLinks.map((l) => [l.index, l.eventId])).toEqual([
			[1, "e2"],
		]);
		expect(result.brokenLinks[0]).toMatchObject({
			expectedPrevHash: rows[1].prevHash,
			actualPrevHash: rows[1].prevHash,
			actualChainHash: rows[1].chainHash,
		});
		expect(result.brokenLinks[0]?.expectedChainHash).not.toBe(
			rows[1].chainHash,
		);
		expect(result.count).toBe(3);
	});

	it("detects a broken prevHash link", async () => {
		const rows = await buildChain([{ a: 1 }, { b: 2 }]);
		rows[1] = { ...rows[1], prevHash: "forged" } as Row;
		const result = await repo(rows).verifyChain(scope);
		expect(result.valid).toBe(false);
		const link = result.brokenLinks.find(
			(l) => l.eventId === "e2" && l.expectedPrevHash === rows[0]?.chainHash,
		);
		expect(link).toMatchObject({
			index: 1,
			actualPrevHash: "forged",
			expectedChainHash: rows[1]?.chainHash,
			actualChainHash: rows[1]?.chainHash,
		});
	});

	it("skips pre-migration events without a chain hash and restarts the chain after them", async () => {
		const tail = await buildChain([{ x: 1 }, { y: 2 }]);
		const marker: Row = {
			eventId: "old",
			prevHash: null,
			chainHash: null,
			occurredAt: new Date(2026, 4, 1),
			payload: {},
		};
		const emptyMarker: Row = { ...marker, eventId: "old2", chainHash: "" };
		const result = await repo([marker, emptyMarker, ...tail]).verifyChain(
			scope,
		);
		expect(result).toEqual({ valid: true, count: 2, brokenLinks: [] });
	});

	it("a pre-migration marker after valid events starts a fresh chain (no false broken link)", async () => {
		const first = await buildChain([{ a: 1 }]);
		const second = await buildChain([{ z: 9 }]);
		const marker: Row = {
			eventId: "old",
			prevHash: null,
			chainHash: null,
			occurredAt: new Date(2026, 5, 15),
			payload: {},
		};
		const result = await repo([
			...first,
			marker,
			...second.map((r) => ({ ...r, eventId: "n1" })),
		]).verifyChain(scope);
		expect(result).toEqual({ valid: true, count: 2, brokenLinks: [] });
	});

	it("a first event that claims a previous hash is a broken link", async () => {
		const rows = await buildChain([{ a: 1 }]);
		const forged: Row = { ...rows[0], prevHash: "ghost" } as Row;
		const result = await repo([forged]).verifyChain(scope);
		expect(result.valid).toBe(false);
		expect(result.brokenLinks[0]).toMatchObject({
			index: 0,
			expectedPrevHash: null,
			actualPrevHash: "ghost",
		});
	});
});

describe("PostgresFiscalTruthRepository.append", () => {
	const event = (payload: Record<string, unknown>) =>
		({
			eventId: "ev-new",
			aggregateId: "agg",
			aggregateType: "t",
			eventKind: "k",
			scope,
			trace: { traceId: "t", correlationId: "c", causationId: null },
			validatorSetVersion: "v",
			policyVersion: "p",
			evidenceRootNodeId: null,
			evidenceBundleHash: null,
			approvalId: null,
			occurredAt: "2026-06-10T00:00:00.000Z",
			payload,
		}) as never;

	it("starts a new chain (prevHash null) when the scope has no events", async () => {
		const { client, inserted } = fakeClient([]);
		await new PostgresFiscalTruthRepository(client).append(event({ a: 1 }));
		expect(inserted).toHaveLength(1);
		expect(inserted[0]).toMatchObject({
			prevHash: null,
			chainHash: await computeAuditHash({ a: 1 }, null),
		});
	});

	it("links to the last chain hash of the scope", async () => {
		const { client, inserted } = fakeClient([{ chainHash: "H-last" }]);
		await new PostgresFiscalTruthRepository(client).append(event({ a: 1 }));
		expect(inserted[0]).toMatchObject({
			prevHash: "H-last",
			chainHash: await computeAuditHash({ a: 1 }, "H-last"),
		});
	});

	it("keeps a null last hash (pre-migration marker) as a new chain start", async () => {
		const { client, inserted } = fakeClient([{ chainHash: null }]);
		await new PostgresFiscalTruthRepository(client).append(event({ a: 1 }));
		expect(inserted[0]).toMatchObject({ prevHash: null });
	});

	it("rejects an invalid occurredAt before inserting", async () => {
		const { client, inserted } = fakeClient([]);
		const bad = { ...(event({}) as object), occurredAt: "not a date" } as never;
		await expect(
			new PostgresFiscalTruthRepository(client).append(bad),
		).rejects.toThrow("Invalid date value");
		expect(inserted).toHaveLength(0);
	});
});
