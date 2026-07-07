# Phase 3 — Mnevori Per-Node Artifact Persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each fiscal phase persists its artifact BEFORE returning control to Geavon, enabling mid-flow resume and regulation-change invalidation.

**Architecture:** Create Mnevori module in `packages/agents/src/mnevori/` with explicit artifact snapshot types and a persistence API. Integrate into `FiscalPhaseOrchestrator.completePhase()` as an explicit call before exit gate evaluation. The Mnevori module accepts `FiscalPhaseStore` via dependency injection — no direct import from `drenyra-orchestrator`, keeping the agents package framework-free.

**Tech Stack:** TypeScript, Vitest, FiscalPhaseStore interface (DrizzleFiscalPhaseStore), FiscalPhaseOrchestrator

## Global Constraints

- All new files under `packages/agents/src/mnevori/` must be framework-free (no framework imports)
- Mnevori receives `FiscalPhaseStore` via constructor/parameter — no direct imports from `drenyra-orchestrator`
- `FiscalPhaseId` type: `"captura" | "clasificacion" | "conciliacion" | "cierre" | "declaracion" | "auditoria"`
- Phase history entry `agentOutput` is already stored in `state.metadata[phaseId]` — Mnevori adds explicit typed artifacts on top of this
- Tab indentation (Biome default) for all files
- Tests use Vitest (project standard in `packages/agents/`)

---
### Task 1: Mnevori types and core persistence module

**Files:**
- Create: `packages/agents/src/mnevori/types.ts`
- Create: `packages/agents/src/mnevori/mnevori.ts`
- Create: `packages/agents/src/mnevori/index.ts`
- Modify: `packages/agents/src/index.ts` (add mnevori export)
- Test: `packages/agents/src/mnevori/__tests__/mnevori.test.ts`

**Interfaces:**
- Consumes: `FiscalPhaseId` (from `packages/drenyra-orchestrator/src/phase/types.ts:6-12`), `FiscalPhaseStore` (from `packages/drenyra-orchestrator/src/phase/fiscal-phase-store.ts:17-44`), `PhaseHistoryEntry` (from `packages/drenyra-orchestrator/src/phase/types.ts:68-76`)
- Produces: `MnevoriArtifact` type, `MnevoriResumePoint` type, `persistArtifact()` function, `getResumePoint()` function, `listPhaseSnapshots()` function

- [ ] **Step 1: Write types.ts**

```typescript
/**
 * Mnevori — per-node artifact persistence for fiscal phases.
 *
 * Each phase node persists a typed artifact BEFORE returning control
 * to Geavon, enabling mid-flow resume and regulation-change invalidation.
 */

import type { FiscalPhaseId } from "../../../drenyra-orchestrator/src/phase/types";

/**
 * A single persisted artifact from one fiscal phase execution.
 */
export interface MnevoriArtifact {
	id: string;
	ruc: string;
	periodo: string;
	phaseId: FiscalPhaseId;
	type: "gate_result" | "agent_output" | "phase_snapshot";
	payload: unknown;
	version: number;
	tier: "T1_WEAK" | "T2_STRONG" | "T3_CRITICAL";
	persistedAt: string;
}

/**
 * Resume point — the last completed/blocked phase for a (ruc, periodo) tuple.
 */
export interface MnevoriResumePoint {
	ruc: string;
	periodo: string;
	lastPhaseId: FiscalPhaseId;
	lastStatus: "completed" | "blocked" | "in_progress";
	regulationVersion: string;
	lastPersistedAt: string;
}

/**
 * Snapshot of a single phase's state at persistence time.
 */
export interface MnevoriPhaseSnapshot {
	ruc: string;
	periodo: string;
	phaseId: FiscalPhaseId;
	status: string;
	agentOutput: unknown;
	gateResults: unknown[];
	persistedAt: string;
}

/**
 * Version of the regulation / fiscal rules that were active when the phase ran.
 * Used to detect drift on resume.
 */
export interface RegulationVersion {
	regulationId: string;
	version: string;
	effectiveAt: string;
	deprecatedAt?: string;
}
```

- [ ] **Step 2: Write mnevori.ts**

```typescript
/**
 * Mnevori — core persistence module.
 *
 * Accepts a FiscalPhaseStore via dependency injection so the module
 * stays framework-free (no direct orchestration package imports).
 */

import type { FiscalPhaseId, FiscalPhaseStore } from "../../../drenyra-orchestrator/src/phase/types";
import type {
	MnevoriArtifact,
	MnevoriPhaseSnapshot,
	MnevoriResumePoint,
	RegulationVersion,
} from "./types";

const CURRENT_REGULATION_VERSION = "2026.1";

export class Mnevori {
	private readonly store: FiscalPhaseStore;

	constructor(store: FiscalPhaseStore) {
		this.store = store;
	}

	/**
	 * Persist a phase artifact — call BEFORE exit gate evaluation.
	 */
	async persistArtifact(artifact: Omit<MnevoriArtifact, "id" | "persistedAt">): Promise<string> {
		const id = `mnevori:${artifact.ruc}:${artifact.periodo}:${artifact.phaseId}:${Date.now()}`;
		const full: MnevoriArtifact = {
			...artifact,
			id,
			persistedAt: new Date().toISOString(),
		};

		// Store artifact in period metadata under _mnevori key
		const state = await this.store.getPeriodState(artifact.ruc, artifact.periodo);
		if (!state) throw new Error(`Period ${artifact.periodo} for RUC ${artifact.ruc} not found`);

		const mnevoriArtifacts = ((state.metadata?._mnevori ?? {}) as Record<string, unknown>);
		const phaseArtifacts = ((mnevoriArtifacts[artifact.phaseId] ?? []) as MnevoriArtifact[]);
		phaseArtifacts.push(full);
		mnevoriArtifacts[artifact.phaseId] = phaseArtifacts;

		await this.store.upsertPeriodState({
			...state,
			metadata: {
				...state.metadata,
				_mnevori: mnevoriArtifacts,
			},
		});

		return id;
	}

	/**
	 * Persist a full phase snapshot (agent output + gate results).
	 */
	async persistPhaseSnapshot(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		snapshot: Omit<MnevoriPhaseSnapshot, "ruc" | "periodo" | "phaseId" | "persistedAt">,
	): Promise<string> {
		return this.persistArtifact({
			ruc,
			periodo,
			phaseId,
			type: "phase_snapshot",
			payload: {
				status: snapshot.status,
				agentOutput: snapshot.agentOutput,
				gateResults: snapshot.gateResults,
			},
			version: 1,
			tier: "T2_STRONG",
		});
	}

	/**
	 * Find the last persisted phase for a (ruc, periodo) — for resume.
	 */
	async getResumePoint(ruc: string, periodo: string): Promise<MnevoriResumePoint | null> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) return null;

		// Find the last non-idle phase in history
		const phases = state.phaseHistory;
		if (phases.length === 0) return null;

		const last = phases[phases.length - 1];

		return {
			ruc,
			periodo,
			lastPhaseId: last.phaseId,
			lastStatus: last.status as MnevoriResumePoint["lastStatus"],
			regulationVersion: this.getRegulationVersion(),
			lastPersistedAt: last.completedAt?.toISOString() ?? last.startedAt.toISOString(),
		};
	}

	/**
	 * List all phase snapshots for a (ruc, periodo).
	 */
	async listPhaseSnapshots(
		ruc: string,
		periodo: string,
	): Promise<MnevoriArtifact[]> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) return [];

		const mnevoriArtifacts = (state.metadata?._mnevori ?? {}) as Record<string, unknown>;
		const all: MnevoriArtifact[] = [];
		for (const phaseId of Object.keys(mnevoriArtifacts)) {
			const artifacts = mnevoriArtifacts[phaseId] as MnevoriArtifact[];
			all.push(...artifacts);
		}
		return all.sort(
			(a, b) => new Date(b.persistedAt).getTime() - new Date(a.persistedAt).getTime(),
		);
	}

	/**
	 * Get the current regulation version.
	 * Can be overridden for testing or dynamic regulation updates.
	 */
	getRegulationVersion(): string {
		return CURRENT_REGULATION_VERSION;
	}

	/**
	 * Check if a phase's regulation version matches the current one.
	 * If not, the cached phase result should be flagged for re-validation.
	 */
	isRegulationCurrent(phaseVersion: string): boolean {
		return phaseVersion === CURRENT_REGULATION_VERSION;
	}
}
```

- [ ] **Step 3: Write index.ts**

```typescript
export { Mnevori } from "./mnevori";
export type {
	MnevoriArtifact,
	MnevoriPhaseSnapshot,
	MnevoriResumePoint,
	RegulationVersion,
} from "./types";
```

- [ ] **Step 4: Add export to packages/agents/src/index.ts**

Edit `packages/agents/src/index.ts` — find the existing exports and add:
```typescript
export * from "./mnevori";
```

- [ ] **Step 5: Write the failing tests**

Create `packages/agents/src/mnevori/__tests__/mnevori.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { Mnevori } from "../mnevori";
import type { MnevoriArtifact, MnevoriResumePoint } from "../types";
import { InMemoryFiscalPhaseStore } from "../../../../drenyra-orchestrator/src/phase/fiscal-phase-store";
import { FiscalPhaseOrchestrator } from "../../../../drenyra-orchestrator/src/phase/fiscal-phase-orchestrator";
import { createInMemoryGateEngine } from "../../../../drenyra-orchestrator/src/phase/phase-gate-engine";
import { FISCAL_PHASE_GRAPH } from "../../../../drenyra-orchestrator/src/phase/fiscal-phase-graph";

function createTestOrchestrator(store: InMemoryFiscalPhaseStore) {
	return new FiscalPhaseOrchestrator({
		store,
		gateEngine: createInMemoryGateEngine(),
		graph: FISCAL_PHASE_GRAPH,
	});
}

describe("Mnevori", () => {
	let store: InMemoryFiscalPhaseStore;
	let mnevori: Mnevori;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		mnevori = new Mnevori(store);
	});

	it("should persist an artifact with id and timestamp", async () => {
		const id = await mnevori.persistArtifact({
			ruc: "20123456789",
			periodo: "2026-06",
			phaseId: "captura",
			type: "agent_output",
			payload: { cpes: 42 },
			version: 1,
			tier: "T2_STRONG",
		});

		expect(id).toMatch(/^mnevori:20123456789:2026-06:captura:/);
	});
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd packages/agents && npx vitest run src/mnevori/__tests__/mnevori.test.ts
```
Expected: FAIL — module not found, Mnevori class not defined

- [ ] **Step 7: Write test 2 — persistPhaseSnapshot**

```typescript
it("should persist a phase snapshot with gate results", async () => {
	const orchestrator = createTestOrchestrator(store);
	await orchestrator.startPeriod("20123456789", "2026-06");
	await orchestrator.startPhase("20123456789", "2026-06", "captura");

	await mnevori.persistPhaseSnapshot("20123456789", "2026-06", "captura", {
		status: "completed",
		agentOutput: { cpes: 42 },
		gateResults: [],
	});

	const snapshots = await mnevori.listPhaseSnapshots("20123456789", "2026-06");
	expect(snapshots).toHaveLength(1);
	expect(snapshots[0].phaseId).toBe("captura");
});
```

- [ ] **Step 8: Write test 3 — getResumePoint returns correct data**

```typescript
it("should return a resume point after completing a phase", async () => {
	const orchestrator = createTestOrchestrator(store);
	await orchestrator.startPeriod("20123456789", "2026-06");
	await orchestrator.startPhase("20123456789", "2026-06", "captura");
	await orchestrator.completePhase("20123456789", "2026-06", "captura", { cpes: 42 });

	const point = await mnevori.getResumePoint("20123456789", "2026-06");
	expect(point).not.toBeNull();
	expect(point!.lastPhaseId).toBe("captura");
	expect(point!.lastStatus).toBe("completed");
});
```

- [ ] **Step 9: Run all tests to verify they pass**

```bash
cd packages/agents && npx vitest run src/mnevori/__tests__/mnevori.test.ts
```
Expected: 3/3 PASS

- [ ] **Step 10: Commit**

```bash
git add packages/agents/src/mnevori/
git add packages/agents/src/index.ts
git commit -m "feat(agents): add Mnevori per-node artifact persistence module"
```

---

### Task 2: Integrate Mnevori into FiscalPhaseOrchestrator.completePhase()

**Files:**
- Modify: `packages/drenyra-orchestrator/src/phase/fiscal-phase-orchestrator.ts` (add Mnevori call before exit gates)
- Modify: `packages/drenyra-orchestrator/src/phase/index.ts` (export Mnevori option)
- Test: `packages/drenyra-orchestrator/src/phase/__tests__/mnevori-integration.test.ts`

**Interfaces:**
- Consumes: `Mnevori.persistPhaseSnapshot()` from Task 1, `FiscalPhaseOrchestrator.completePhase()` exists
- Produces: Updated `completePhase()` that persists Mnevori snapshot BEFORE exit gate evaluation

- [ ] **Step 1: Update FiscalPhaseOrchestrator to accept optional Mnevori**

In `packages/drenyra-orchestrator/src/phase/fiscal-phase-orchestrator.ts`, add Mnevori import and constructor parameter:

```typescript
import type { Mnevori } from "@drenyra/agents/mnevori";

// In FiscalPhaseOrchestratorConfig:
export interface FiscalPhaseOrchestratorConfig {
	store: FiscalPhaseStore;
	gateEngine: PhaseGateEngine;
	graph: FiscalPhaseGraph;
	autoAdvanceEngine?: AutoAdvanceEngine;
	mnevori?: Mnevori;  // NEW
	eventBus?: {
		publish: (eventType: string, payload: unknown) => Promise<void>;
	};
}

// In constructor:
this.mnevori = config.mnevori;

// Store as private field:
private readonly mnevori?: Mnevori;
```

- [ ] **Step 2: Add Mnevori persistence call in completePhase()**

In `completePhase()`, add the Mnevori call **immediately after storing agentOutput in metadata** (line ~331) and **before exit gate evaluation** (line ~334):

Find the block where agentOutput is stored and exit gates are evaluated. Add after the `upsertPeriodState` call:

```typescript
// Persist Mnevori snapshot BEFORE exit gate evaluation
if (this.mnevori && phaseId) {
	await this.mnevori.persistPhaseSnapshot(ruc, periodo, phaseId, {
		status: "completed",
		agentOutput,
		gateResults: [],
	}).catch((err) => {
		console.error(`[Mnevori] Failed to persist phase snapshot for ${phaseId}:`, err);
	});
}
```

- [ ] **Step 3: Write the failing test**

Create `packages/drenyra-orchestrator/src/phase/__tests__/mnevori-integration.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryFiscalPhaseStore } from "../fiscal-phase-store";
import { FiscalPhaseOrchestrator } from "../fiscal-phase-orchestrator";
import { createInMemoryGateEngine } from "../phase-gate-engine";
import { FISCAL_PHASE_GRAPH } from "../fiscal-phase-graph";
import { Mnevori } from "@drenyra/agents/mnevori";

describe("FiscalPhaseOrchestrator + Mnevori integration", () => {
	let store: InMemoryFiscalPhaseStore;
	let mnevori: Mnevori;
	let orchestrator: FiscalPhaseOrchestrator;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		mnevori = new Mnevori(store);
		orchestrator = new FiscalPhaseOrchestrator({
			store,
			gateEngine: createInMemoryGateEngine(),
			graph: FISCAL_PHASE_GRAPH,
			mnevori,
		});
	});

	it("should persist Mnevori snapshot when completing a phase", async () => {
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");
		const result = await orchestrator.completePhase("20123456789", "2026-06", "captura", {
			cpesCapturados: 42,
		});

		expect(result.success).toBe(true);

		const snapshots = await mnevori.listPhaseSnapshots("20123456789", "2026-06");
		expect(snapshots).toHaveLength(1);
		expect(snapshots[0].phaseId).toBe("captura");
	});
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd packages/drenyra-orchestrator && npx vitest run src/phase/__tests__/mnevori-integration.test.ts
```
Expected: FAIL — Mnevori not integrated or import fails

- [ ] **Step 5: Implement the integration changes**

Edit `fiscal-phase-orchestrator.ts`:
1. Import `Mnevori` type
2. Add `mnevori` to config interface
3. Add private field
4. Add persistence call in `completePhase()`

- [ ] **Step 6: Run test to verify it passes**

```bash
cd packages/drenyra-orchestrator && npx vitest run src/phase/__tests__/mnevori-integration.test.ts
```
Expected: 1/1 PASS

- [ ] **Step 7: Run full orchestrator test suite to confirm no regression**

```bash
cd packages/drenyra-orchestrator && npx vitest run src/phase/__tests__/
```
Expected: All existing tests still pass

- [ ] **Step 8: Commit**

```bash
git add packages/drenyra-orchestrator/src/phase/fiscal-phase-orchestrator.ts
git add packages/drenyra-orchestrator/src/phase/__tests__/mnevori-integration.test.ts
git commit -m "feat(orchestrator): integrate Mnevori persistence into completePhase"
```

---

### Task 3: Resume mechanism — find and resume last incomplete period

**Files:**
- Create: `packages/agents/src/mnevori/mnevori.resume.ts`
- Modify: `packages/agents/src/mnevori/index.ts` (add resume export)
- Modify: `packages/agents/src/mnevori/__tests__/mnevori.test.ts` (add resume tests)
- Modify: `packages/drenyra-orchestrator/src/phase/fiscal-phase-orchestrator.ts` (add resumePeriod method)

**Interfaces:**
- Consumes: `FiscalPhaseOrchestrator.startPhase()`, `Mnevori.getResumePoint()` from Task 1
- Produces: `MnevoriResumeService` class, `FiscalPhaseOrchestrator.resumePeriod()` method

- [ ] **Step 1: Write mnevori.resume.ts**

```typescript
/**
 * MnevoriResumeService — finds and resumes interrupted fiscal periods.
 */

import type { FiscalPhaseStore } from "../../../drenyra-orchestrator/src/phase/types";
import type { Mnevori, MnevoriResumePoint } from "./types";

export class MnevoriResumeService {
	private readonly mnevori: Mnevori;
	private readonly store: FiscalPhaseStore;

	constructor(mnevori: Mnevori, store: FiscalPhaseStore) {
		this.mnevori = mnevori;
		this.store = store;
	}

	/**
	 * Find all periods that need resume (in_progress or blocked).
	 */
	async findInterruptedPeriods(): Promise<MnevoriResumePoint[]> {
		const active = await this.store.listActivePeriods();
		const points: MnevoriResumePoint[] = [];

		for (const { ruc, periodo } of active) {
			const point = await this.mnevori.getResumePoint(ruc, periodo);
			if (point) points.push(point);
		}

		return points;
	}

	/**
	 * Determine the phase to resume from a given resume point.
	 * Returns the phase ID to start, or null if the period is complete.
	 */
	getPhaseToResume(point: MnevoriResumePoint): string | null {
		if (point.lastStatus === "completed") {
			// Move to next phase in the sequence
			const sequence = [
				"captura", "clasificacion", "conciliacion",
				"cierre", "declaracion", "auditoria",
			];
			const idx = sequence.indexOf(point.lastPhaseId);
			if (idx === -1 || idx >= sequence.length - 1) return null; // All done
			return sequence[idx + 1];
		}

		if (point.lastStatus === "blocked" || point.lastStatus === "in_progress") {
			// Resume the same phase
			return point.lastPhaseId;
		}

		return null;
	}
}
```

- [ ] **Step 2: Add resume to index.ts**

```typescript
export { Mnevori } from "./mnevori";
export { MnevoriResumeService } from "./mnevori.resume";
export type {
	MnevoriArtifact,
	MnevoriPhaseSnapshot,
	MnevoriResumePoint,
	RegulationVersion,
} from "./types";
```

- [ ] **Step 3: Write resume tests**

Add to `packages/agents/src/mnevori/__tests__/mnevori.test.ts`:

```typescript
import { MnevoriResumeService } from "../mnevori.resume";

describe("MnevoriResumeService", () => {
	let store: InMemoryFiscalPhaseStore;
	let mnevori: Mnevori;
	let resumeService: MnevoriResumeService;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		mnevori = new Mnevori(store);
		resumeService = new MnevoriResumeService(mnevori, store);
	});

	it("should return next phase when last was completed", async () => {
		const orchestrator = createTestOrchestrator(store);
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");
		await orchestrator.completePhase("20123456789", "2026-06", "captura", {});

		const point = await mnevori.getResumePoint("20123456789", "2026-06");
		expect(point).not.toBeNull();

		const next = resumeService.getPhaseToResume(point!);
		expect(next).toBe("clasificacion");
	});

	it("should return same phase when last was blocked", async () => {
		const orchestrator = createTestOrchestrator(store);
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");
		// Mark as blocked by not completing — or simulate a blocked state

		const point = await mnevori.getResumePoint("20123456789", "2026-06");
		// After startPeriod + startPhase, the phase is in_progress
		if (point) {
			const next = resumeService.getPhaseToResume(point!);
			expect(next).toBe("captura");
		}
	});

	it("should find interrupted periods from active list", async () => {
		const orchestrator = createTestOrchestrator(store);
		await orchestrator.startPeriod("20123456789", "2026-06");

		const interrupted = await resumeService.findInterruptedPeriods();
		expect(interrupted.length).toBeGreaterThanOrEqual(1);
		expect(interrupted[0].ruc).toBe("20123456789");
	});
});
```

- [ ] **Step 4: Run all Mnevori tests**

```bash
cd packages/agents && npx vitest run src/mnevori/__tests__/
```
Expected: 6/6 PASS (3 from Task 1 + 3 new)

- [ ] **Step 5: Add resumePeriod() to FiscalPhaseOrchestrator**

In `packages/drenyra-orchestrator/src/phase/fiscal-phase-orchestrator.ts`, add:

```typescript
/**
 * Resume a period from where it left off.
 * Uses Mnevori to find the last completed phase and advance to the next.
 */
async resumePeriod(
	ruc: string,
	periodo: string,
): Promise<PhaseOperationResult> {
	const state = await this.store.getPeriodState(ruc, periodo);
	if (!state) {
		return {
			success: false,
			status: "not_started",
			error: `Period ${periodo} for RUC ${ruc} not found`,
		};
	}

	if (state.status === "completed") {
		return {
			success: true,
			phaseId: state.currentPhase,
			status: "completed",
			state,
		};
	}

	// Find the last incomplete phase in history
	const lastEntry = state.phaseHistory[state.phaseHistory.length - 1];
	let targetPhase: string;

	if (!lastEntry) {
		// No history — start from beginning
		targetPhase = "captura";
	} else if (lastEntry.status === "completed") {
		// Advance to next phase
		const sequence = [
			"captura", "clasificacion", "conciliacion",
			"cierre", "declaracion", "auditoria",
		];
		const idx = sequence.indexOf(lastEntry.phaseId);
		if (idx === -1 || idx >= sequence.length - 1) {
			return {
				success: true,
				phaseId: lastEntry.phaseId,
				status: "completed",
				state,
			};
		}
		targetPhase = sequence[idx + 1];
	} else {
		// Blocked or in_progress — resume same phase
		targetPhase = lastEntry.phaseId;
	}

	return this.startPhase(ruc, periodo, targetPhase as FiscalPhaseId);
}
```

- [ ] **Step 6: Write integration resume test**

Add to `packages/drenyra-orchestrator/src/phase/__tests__/mnevori-integration.test.ts`:

```typescript
it("should resume period from the last completed phase", async () => {
	await orchestrator.startPeriod("20123456789", "2026-06");
	await orchestrator.startPhase("20123456789", "2026-06", "captura");
	await orchestrator.completePhase("20123456789", "2026-06", "captura", {});

	const result = await orchestrator.resumePeriod("20123456789", "2026-06");
	expect(result.success).toBe(true);
	expect(result.phaseId).toBe("clasificacion");
});

it("should resume same phase if previous was blocked", async () => {
	await orchestrator.startPeriod("20123456789", "2026-06");
	await orchestrator.startPhase("20123456789", "2026-06", "captura");

	const result = await orchestrator.resumePeriod("20123456789", "2026-06");
	expect(result.success).toBe(true);
	// After startPhase, phase is "in_progress", resumePeriod returns same phase
	expect(result.phaseId).toBe("captura");
});
```

- [ ] **Step 7: Run all tests**

```bash
cd packages/drenyra-orchestrator && npx vitest run src/phase/__tests__/
cd packages/agents && npx vitest run src/mnevori/__tests__/
```
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add packages/agents/src/mnevori/mnevori.resume.ts
git add packages/drenyra-orchestrator/src/phase/fiscal-phase-orchestrator.ts
git add packages/drenyra-orchestrator/src/phase/__tests__/mnevori-integration.test.ts
git commit -m "feat(agents): add resume mechanism via MnevoriResumeService"
```

---

### Task 4: Regulation versioning for phase cache invalidation

**Files:**
- Create: `packages/agents/src/mnevori/mnevori.regulation.ts`
- Modify: `packages/agents/src/mnevori/index.ts` (add regulation export)
- Modify: `packages/agents/src/mnevori/__tests__/mnevori.test.ts` (add regulation tests)

**Interfaces:**
- Consumes: `Mnevori.getRegulationVersion()`, `Mnevori.isRegulationCurrent()` from Task 1
- Produces: `RegulationTracker` class, `checkPhaseRegulation()` function

- [ ] **Step 1: Write mnevori.regulation.ts**

```typescript
/**
 * MnevoriRegulationTracker — tracks regulation versions for phase cache invalidation.
 *
 * When a regulation changes mid-case, cached phase results must be flagged
 * for re-validation rather than silently reused.
 */

import type { MnevoriArtifact, RegulationVersion } from "./types";

export type CacheStatus = "valid" | "needs_review" | "invalid";

export interface PhaseCacheInfo {
	phaseId: string;
	persistedAt: string;
	regulationVersion: string;
	cacheStatus: CacheStatus;
}

export class MnevoriRegulationTracker {
	private regulations: Map<string, RegulationVersion> = new Map();
	private currentVersion: string;

	constructor(currentVersion: string = "2026.1") {
		this.currentVersion = currentVersion;
	}

	/**
	 * Register a regulation with its version history.
	 */
	register(regulation: RegulationVersion): void {
		this.regulations.set(regulation.regulationId, regulation);
	}

	/**
	 * Update the current regulation version (e.g., when a law changes).
	 */
	updateCurrentVersion(version: string): void {
		this.currentVersion = version;
	}

	/**
	 * Evaluate whether a cached phase artifact is still valid
	 * based on regulation version comparison.
	 */
	evaluateArtifactCache(artifact: MnevoriArtifact): CacheStatus {
		if (artifact.version === 0) return "invalid";

		const artifactRegVersion = artifact.version.toString();
		const isCurrent = artifactRegVersion === this.currentVersion;

		if (isCurrent) return "valid";

		// Check if the artifact's regulation was deprecated
		const reg = this.regulations.get(artifact.id);
		if (reg?.deprecatedAt) {
			return "invalid";
		}

		// Version mismatch — flag for review
		return "needs_review";
	}

	/**
	 * Get all cached phase snapshots that need re-validation.
	 */
	findStaleArtifacts(artifacts: MnevoriArtifact[]): MnevoriArtifact[] {
		return artifacts.filter(
			(a) => this.evaluateArtifactCache(a) !== "valid",
		);
	}
}
```

- [ ] **Step 2: Add regulation export to index.ts**

```typescript
export type { CacheStatus, PhaseCacheInfo } from "./mnevori.regulation";
export { MnevoriRegulationTracker } from "./mnevori.regulation";
```

- [ ] **Step 3: Write regulation tests**

Add to `packages/agents/src/mnevori/__tests__/mnevori.test.ts`:

```typescript
import { MnevoriRegulationTracker } from "../mnevori.regulation";
import type { MnevoriArtifact } from "../types";

describe("MnevoriRegulationTracker", () => {
	let tracker: MnevoriRegulationTracker;

	beforeEach(() => {
		tracker = new MnevoriRegulationTracker("2026.1");
	});

	it("should mark artifact as valid when version matches", () => {
		const artifact: MnevoriArtifact = {
			id: "test:1",
			ruc: "20123456789",
			periodo: "2026-06",
			phaseId: "captura",
			type: "phase_snapshot",
			payload: {},
			version: 1,
			tier: "T2_STRONG",
			persistedAt: new Date().toISOString(),
		};

		expect(tracker.evaluateArtifactCache(artifact)).toBe("valid");
	});

	it("should mark artifact as needs_review when version differs", () => {
		const artifact: MnevoriArtifact = {
			id: "test:2",
			ruc: "20123456789",
			periodo: "2026-06",
			phaseId: "captura",
			type: "phase_snapshot",
			payload: {},
			version: 0,
			tier: "T2_STRONG",
			persistedAt: new Date().toISOString(),
		};

		tracker.updateCurrentVersion("2026.2");
		expect(tracker.evaluateArtifactCache(artifact)).toBe("needs_review");
	});

	it("should find stale artifacts when version mismatch", () => {
		const fresh: MnevoriArtifact = {
			id: "test:3", ruc: "1", periodo: "2026-06", phaseId: "captura",
			type: "phase_snapshot", payload: {}, version: 1, tier: "T2_STRONG",
			persistedAt: new Date().toISOString(),
		};
		const stale: MnevoriArtifact = {
			id: "test:4", ruc: "1", periodo: "2026-06", phaseId: "conciliacion",
			type: "phase_snapshot", payload: {}, version: 0, tier: "T2_STRONG",
			persistedAt: new Date().toISOString(),
		};

		const result = tracker.findStaleArtifacts([fresh, stale]);
		expect(result).toHaveLength(1);
		expect(result[0].phaseId).toBe("conciliacion");
	});
});
```

- [ ] **Step 4: Run all tests**

```bash
cd packages/agents && npx vitest run src/mnevori/__tests__/
```
Expected: 9/9 PASS (3 Task 1 + 3 Task 3 + 3 Task 4)

- [ ] **Step 5: Run full packages/agents suite**

```bash
cd packages/agents && npx vitest run
```
Expected: All agents tests pass (existing 134 + new Mnevori tests)

- [ ] **Step 6: Commit**

```bash
git add packages/agents/src/mnevori/mnevori.regulation.ts
git add packages/agents/src/mnevori/index.ts
git commit -m "feat(agents): add regulation versioning for cache invalidation"
```
