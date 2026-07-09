import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryArtifactStore } from "../artifact-store";
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
