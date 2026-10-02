import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createArtifactStore,
	FileArtifactStore,
	InMemoryArtifactStore,
} from "../artifact-store";
import type { FaseArtifact } from "../types";

function makeArtifact(fase: string, status = "SUCCESS"): FaseArtifact {
	return {
		fase: fase as FaseArtifact["fase"],
		status: status as FaseArtifact["status"],
		input: { test: true },
		output: { result: fase },
		gateResults: [],
		evidence: [],
		errors: [],
		confidence: 0.9,
		ejecutadoEn: new Date().toISOString(),
		duracionMs: 100,
	};
}

describe("InMemoryArtifactStore", () => {
	let store: InMemoryArtifactStore;

	beforeEach(() => {
		store = new InMemoryArtifactStore();
	});

	it("saves and loads a fase artifact", async () => {
		const artifact = makeArtifact("solicitud");
		await store.save("cambio-001", artifact);

		const loaded = await store.load("cambio-001", "solicitud");
		expect(loaded).not.toBeNull();
		expect(loaded?.fase).toBe("solicitud");
		expect(loaded?.confidence).toBe(0.9);
	});

	it("returns null for non-existent phase", async () => {
		const loaded = await store.load("cambio-001", "solicitud");
		expect(loaded).toBeNull();
	});

	it("returns null for non-existent change", async () => {
		const loaded = await store.load("no-existe", "solicitud");
		expect(loaded).toBeNull();
	});

	it("loads all artifacts for a change", async () => {
		await store.save("cambio-001", makeArtifact("solicitud"));
		await store.save("cambio-001", makeArtifact("analisis"));
		await store.save("cambio-001", makeArtifact("diseno"));

		const all = await store.loadAll("cambio-001");
		expect(all.size).toBe(3);
		expect(all.has("solicitud")).toBe(true);
		expect(all.has("analisis")).toBe(true);
		expect(all.has("diseno")).toBe(true);
	});

	it("handles multiple changes independently", async () => {
		await store.save("cambio-001", makeArtifact("solicitud"));
		await store.save("cambio-002", makeArtifact("solicitud"));

		const all1 = await store.loadAll("cambio-001");
		const all2 = await store.loadAll("cambio-002");
		expect(all1.size).toBe(1);
		expect(all2.size).toBe(1);
	});

	it("overwrites existing artifact for same fase", async () => {
		await store.save("cambio-001", makeArtifact("solicitud", "SUCCESS"));
		await store.save("cambio-001", makeArtifact("solicitud", "BLOCKED"));

		const loaded = await store.load("cambio-001", "solicitud");
		expect(loaded?.status).toBe("BLOCKED");
	});

	it("lists all known change IDs", async () => {
		await store.save("cambio-001", makeArtifact("solicitud"));
		await store.save("cambio-002", makeArtifact("solicitud"));
		await store.save("cambio-003", makeArtifact("solicitud"));

		const changes = await store.listChanges();
		expect(changes).toEqual(
			expect.arrayContaining(["cambio-001", "cambio-002", "cambio-003"]),
		);
		expect(changes).toHaveLength(3);
	});

	it("health check always returns true", async () => {
		const healthy = await store.healthCheck();
		expect(healthy).toBe(true);
	});
});

describe('FileArtifactStore (mode "files")', () => {
	let dir: string;
	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), "fsd-artifacts-"));
	});

	it('is what createArtifactStore returns for mode "files"', async () => {
		const store = createArtifactStore("files", dir);
		expect(store).toBeInstanceOf(FileArtifactStore);
		await rm(dir, { recursive: true, force: true });
	});

	it("round-trips an artifact under cambios/{changeId}/{fase}.json", async () => {
		const store = createArtifactStore("files", dir);
		const artifact = {
			fase: "solicitud",
			changeId: "chg-1",
		} as unknown as FaseArtifact;
		await store.save("chg-1", artifact);
		expect(await store.load("chg-1", "solicitud")).toEqual(artifact);
		expect(await store.listChanges()).toContain("chg-1");
		await rm(dir, { recursive: true, force: true });
	});

	it('rejects the retired "openspec" mode instead of silently using memory', () => {
		expect(() => createArtifactStore("openspec" as never, dir)).toThrow(
			/renamed to "files"/,
		);
	});
});
