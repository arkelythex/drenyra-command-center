import { describe, expect, it } from "vitest";
import { BatchOrchestrator } from "../batch-orchestrator";

const D = new Date("2026-07-01T00:00:00.000Z");
const RUC = "20123456789";

interface Script {
	startPeriod?: { success: boolean; error?: string };
	startPhase?: Record<
		string,
		{ success: boolean; status?: string; error?: string; blockers?: string[] }
	>;
	completePhase?: Record<
		string,
		{ success: boolean; error?: string; blockers?: string[] }
	>;
	finalState?: { currentPhase: string; status: string } | null;
	stateStatus?: string | null;
	startPeriodThrows?: boolean;
	pauseBeforeStart?: "all" | "ruc";
}

async function scenario(script: Script, withCallbacks = true) {
	const log: string[] = [];
	const orchestrator = {
		startPeriod: async () => {
			if (script.startPeriodThrows) throw new Error("kaboom");
			return script.startPeriod ?? { success: true };
		},
		startPhase: async (_r: string, _p: string, phase: string) => {
			log.push(`startPhase:${phase}`);
			const r = script.startPhase?.[phase] ?? { success: true };
			return {
				...r,
				gateResult: r.blockers ? { blockers: r.blockers } : undefined,
			};
		},
		completePhase: async (
			_r: string,
			_p: string,
			phase: string,
			out: { summary: string },
			opts: unknown,
		) => {
			log.push(`completePhase:${phase}:${JSON.stringify(opts)}:${out.summary}`);
			const r = script.completePhase?.[phase] ?? { success: true };
			return {
				...r,
				gateResult: r.blockers ? { blockers: r.blockers } : undefined,
			};
		},
	};
	const store = {
		getPeriodState: async () => {
			if (script.finalState === null) return null;
			const base = script.finalState ?? {
				currentPhase: "auditoria",
				status: "completed",
			};
			return {
				...base,
				status: script.stateStatus ?? base.status,
				updatedAt: D,
				ruc: RUC,
				periodo: "2026-06",
			};
		},
	};
	const callbacks = withCallbacks
		? {
				onPhaseBlocked: async (
					_r: string,
					_p: string,
					ph: string,
					b: string[],
				) => void log.push(`blocked:${ph}:${b.join("|")}`),
				onError: async (_r: string, _p: string, ph: string, e: string) =>
					void log.push(`error:${ph}:${e}`),
				onPhaseComplete: async (_r: string, _p: string, ph: string) =>
					void log.push(`complete:${ph}`),
				onPeriodComplete: async () => void log.push("periodComplete"),
			}
		: undefined;
	const batch = new BatchOrchestrator(
		orchestrator as never,
		store as never,
		{ maxParallel: 1, autoAdvance: true },
		callbacks as never,
	);
	if (script.pauseBeforeStart === "all") await batch.pause();
	if (script.pauseBeforeStart === "ruc") await batch.pause([RUC]);
	await batch.start([{ ruc: RUC, periodo: "2026-06" }]);
	const status = await batch.waitForCompletion();
	const [entry] = status.entries;
	return {
		entry: { ...entry, startedAt: undefined },
		counts: [
			status.completed,
			status.inProgress,
			status.blocked,
			status.failed,
			status.notStarted,
		],
		log,
	};
}

describe("BatchOrchestrator.processSingleEntry (characterization)", () => {
	const scripts: Record<string, Script> = {
		"happy path through all six phases": {},
		"happy path but final state not completed": {
			finalState: { currentPhase: "declaracion", status: "in_progress" },
		},
		"happy path but no final state": { finalState: null },
		"startPeriod fails": { startPeriod: { success: false, error: "no db" } },
		"startPeriod fails without message": { startPeriod: { success: false } },
		"startPeriod already exists is tolerated": {
			startPeriod: { success: false, error: "period already exists" },
		},
		"startPeriod throws": { startPeriodThrows: true },
		"first phase blocked at entry": {
			startPhase: {
				captura: {
					success: false,
					status: "blocked",
					error: "gate x",
					blockers: ["b1", "b2"],
				},
			},
		},
		"entry blocked without gate result": {
			startPhase: {
				captura: { success: false, status: "blocked", error: "gate x" },
			},
		},
		"phase start failed": {
			startPhase: {
				conciliacion: { success: false, status: "error", error: "boom" },
			},
		},
		"phase start failed without message": {
			startPhase: { clasificacion: { success: false } },
		},
		"complete fails, period state blocked": {
			completePhase: {
				clasificacion: { success: false, error: "exit gate", blockers: ["x"] },
			},
			stateStatus: "blocked",
		},
		"complete fails, period state failed": {
			completePhase: { clasificacion: { success: false, error: "exit gate" } },
			stateStatus: "failed",
		},
		"complete fails, no period state": {
			completePhase: { captura: { success: false, error: "nope" } },
			finalState: null,
		},
		"paused for all": { pauseBeforeStart: "all" },
		"paused for the ruc": { pauseBeforeStart: "ruc" },
	};

	for (const [name, script] of Object.entries(scripts)) {
		it(`pins entry status, counts and callbacks: ${name}`, async () => {
			expect(await scenario(script)).toMatchSnapshot();
		});
	}

	it("works without callbacks", async () => {
		const r = await scenario({}, false);
		expect(r.entry.status).toBe("completed");
		expect(r.entry.phasesCompleted).toBe(6);
	});
});
