import { describe, expect, it, vi } from "vitest";
import { createDefaultPhaseGraph } from "../fiscal-phase-graph";
import { FiscalPhaseOrchestrator } from "../fiscal-phase-orchestrator";
import { InMemoryFiscalPhaseStore } from "../fiscal-phase-store";
import { PhaseGateEngine } from "../phase-gate-engine";

const ok = (phaseId: string) => ({
	success: true,
	phaseId,
	gateResult: {
		transition: { from: phaseId, to: phaseId },
		allPassed: true,
		gates: [],
		blockers: [],
		summary: "ok",
	},
});

interface Script {
	startPeriod?: { success: boolean; error?: string };
	startPhaseFailsAt?: string;
	noStateAt?: string; // getPeriodState returns null before running this phase's agent
	agentErrorAt?: string;
	completeFailsAt?: string;
	noUpdatedStateAfter?: string;
}

async function scenario(script: Script) {
	const store = new InMemoryFiscalPhaseStore();
	const o = new FiscalPhaseOrchestrator({
		store,
		gateEngine: new PhaseGateEngine(),
		graph: createDefaultPhaseGraph(),
		eventBus: { publish: async () => {} },
	} as never);
	const log: string[] = [];
	let currentRunning = "";
	let stateReads = 0;

	vi.spyOn(o, "startPeriod").mockImplementation(
		async () => (script.startPeriod ?? { success: true }) as never,
	);
	vi.spyOn(o, "startPhase").mockImplementation((async (
		_r: string,
		_p: string,
		phase: string,
	) => {
		log.push(`startPhase:${phase}`);
		currentRunning = phase;
		return phase === script.startPhaseFailsAt
			? { success: false, status: "blocked", error: `entry ${phase}` }
			: { success: true, status: "in_progress" };
	}) as never);
	vi.spyOn(o, "failPhase").mockImplementation((async (
		_r: string,
		_p: string,
		phase: string,
		error: string,
	) => {
		log.push(`failPhase:${phase}:${error}`);
		return { success: true, status: "failed" };
	}) as never);
	vi.spyOn(o, "completePhase").mockImplementation((async (
		_r: string,
		_p: string,
		phase: string,
		out: unknown,
		opts: unknown,
	) => {
		log.push(
			`completePhase:${phase}:${JSON.stringify(out)}:${JSON.stringify(opts)}`,
		);
		return phase === script.completeFailsAt
			? { ...ok(phase), success: false, error: `exit ${phase}` }
			: ok(phase);
	}) as never);
	vi.spyOn(store, "getPeriodState").mockImplementation((async () => {
		stateReads++;
		const afterRun = log.some((l) =>
			l.startsWith(`completePhase:${currentRunning}`),
		);
		if (!afterRun && currentRunning === script.noStateAt) return null;
		if (afterRun && currentRunning === script.noUpdatedStateAfter) return null;
		return {
			ruc: "r",
			periodo: "p",
			currentPhase: currentRunning,
			status: "in_progress",
			phaseHistory: [],
			metadata: {},
		} as never;
	}) as never);

	const agentRunner = async (phase: string) => {
		log.push(`agent:${phase}`);
		return phase === script.agentErrorAt
			? { output: null, error: `agent ${phase}` }
			: { output: { phase } };
	};
	const result = await o.runPeriodContinuously(
		"20123456789",
		"2026-06",
		agentRunner as never,
	);
	return { result, log, stateReads };
}

describe("FiscalPhaseOrchestrator.runPeriodContinuously (characterization)", () => {
	const scripts: Record<string, Script> = {
		"full cycle reaches auditoria": {},
		"startPeriod fails": { startPeriod: { success: false, error: "no db" } },
		"startPeriod fails without error": { startPeriod: { success: false } },
		"entry gate blocks phase 3": { startPhaseFailsAt: "conciliacion" },
		"period state missing before agent": { noStateAt: "clasificacion" },
		"agent returns an error": { agentErrorAt: "cierre" },
		"exit gate blocks phase 2": { completeFailsAt: "clasificacion" },
		"state vanishes after completing phase 4": {
			noUpdatedStateAfter: "cierre",
		},
	};
	for (const [name, script] of Object.entries(scripts)) {
		it(`pins result and call sequence: ${name}`, async () => {
			expect(await scenario(script)).toMatchSnapshot();
		});
	}
});
