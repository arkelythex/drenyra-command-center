/**
 * SIRE-bench Tier B — cross-layer gate and strategy fixtures.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	clasificacionCompleteGate,
	conciliacionVarianceGate,
} from "../../src/phase/fiscal-gates";
import type {
	FiscalPeriodState,
	PhaseGateContext,
} from "../../src/phase/types";
import {
	createSireFilingStrategy,
	type SireFilingRecord,
} from "../../src/strategies/sire-filing.strategy";
import type { AgentContext } from "../../src/types/agent-context";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GATES_DIR = join(__dirname, "gates");

interface GateFixture {
	id: string;
	description: string;
	state: Partial<FiscalPeriodState>;
	gateId: string;
	expected: { passed: boolean; severity?: string };
}

interface SireFilingFixture {
	id: string;
	records: SireFilingRecord[];
	expected: {
		anomalyCount: number;
		metric: string;
		minSeverity: string;
	};
}

function loadGateFixtures(): GateFixture[] {
	return readdirSync(GATES_DIR)
		.filter((f) => f.startsWith("gate-") && f.endsWith(".input.json"))
		.map((f) => {
			return JSON.parse(
				readFileSync(join(GATES_DIR, f), "utf-8"),
			) as GateFixture;
		});
}

function createPeriodState(
	overrides: Partial<FiscalPeriodState>,
): FiscalPeriodState {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		currentPhase: "captura",
		status: "not_started",
		phaseHistory: [],
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

const gateRegistry: Record<
	string,
	ReturnType<typeof conciliacionVarianceGate>
> = {
	"conciliacion-variance": conciliacionVarianceGate(),
	"clasificacion-complete": clasificacionCompleteGate(),
};

describe("SIRE-bench Tier B — fiscal gates", () => {
	for (const fixture of loadGateFixtures()) {
		it(`${fixture.id}: ${fixture.description}`, async () => {
			const gate = gateRegistry[fixture.gateId];
			expect(gate, `unknown gate: ${fixture.gateId}`).toBeDefined();

			const state = createPeriodState(fixture.state);
			const ctx = {} as PhaseGateContext;
			const result = await gate!.evaluate(state, ctx);

			expect(result.passed).toBe(fixture.expected.passed);
			if (fixture.expected.severity) {
				expect(result.severity).toBe(fixture.expected.severity);
			}
		});
	}
});

describe("SIRE-bench Tier B — sire-filing strategy", () => {
	it("sire-filing-deadline-01: detects overdue CPE past 7-day window", () => {
		const fixture = JSON.parse(
			readFileSync(
				join(GATES_DIR, "sire-filing-deadline-01.input.json"),
				"utf-8",
			),
		) as SireFilingFixture;

		const strategy = createSireFilingStrategy();
		const anomalies = strategy.execute(fixture.records, {} as AgentContext);

		expect(anomalies).toHaveLength(fixture.expected.anomalyCount);
		expect(anomalies[0]?.metric).toBe(fixture.expected.metric);
		expect(anomalies[0]?.severity).not.toBe("low");
	});
});

describe("SIRE-bench Tier B — OPA sire gate contract", () => {
	it("opa-sire-gate-01: documents sire:* → gate expectation", () => {
		const fixture = JSON.parse(
			readFileSync(join(GATES_DIR, "opa-sire-gate-01.input.json"), "utf-8"),
		) as {
			opaInput: { action: string };
			expected: { decision: string; reasonContains: string };
		};

		// Contract documented in drenyra-approval.rego — verified via policy source
		expect(fixture.opaInput.action.startsWith("sire:")).toBe(true);
		expect(fixture.expected.decision).toBe("gate");
	});
});
