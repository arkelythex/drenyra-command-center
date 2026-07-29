import { useMachine } from "@xstate/react";
import { assign } from "xstate";
import { createProcessMachine } from "@/lib/process-machine";
import { parseSireFile } from "../services/sire-parser";
import type {
	ReconciliationStats,
	SireDiscrepancy,
	SireRecord,
} from "../types/sire.types";

function calculateDiscrepancies(
	sunatRecords: SireRecord[],
	localRecords: SireRecord[],
): { discrepancies: SireDiscrepancy[]; stats: ReconciliationStats } {
	const diffs: SireDiscrepancy[] = [];

	sunatRecords.forEach((sunat) => {
		const match = localRecords.find(
			(local) =>
				local.rucEmisor === sunat.rucEmisor &&
				local.serie === sunat.serie &&
				local.numero === sunat.numero,
		);

		if (!match) {
			diffs.push({
				id: `diff_${sunat.serie}_${sunat.numero}`,
				type: "MISSING_IN_ARKELYTHEX",
				severity: "HIGH",
				recordSunat: sunat,
			});
		} else if (Math.abs(match.total - sunat.total) > 0.1) {
			diffs.push({
				id: `diff_${sunat.serie}_${sunat.numero}`,
				type: "AMOUNT_MISMATCH",
				severity: "MEDIUM",
				recordSunat: sunat,
				recordLocal: match,
				diffAmount: Math.abs(match.total - sunat.total),
			});
		}
	});

	localRecords.forEach((local) => {
		const match = sunatRecords.find(
			(sunat) =>
				sunat.rucEmisor === local.rucEmisor &&
				sunat.serie === local.serie &&
				sunat.numero === local.numero,
		);

		if (!match && sunatRecords.length > 0) {
			diffs.push({
				id: `diff_${local.serie}_${local.numero}`,
				type: "MISSING_IN_SUNAT",
				severity: "MEDIUM",
				recordLocal: local,
			});
		}
	});

	const stats: ReconciliationStats = {
		totalSunat: sunatRecords.reduce((sum, r) => sum + r.total, 0),
		totalLocal: localRecords.reduce((sum, r) => sum + r.total, 0),
		matchCount: sunatRecords.length + localRecords.length - diffs.length,
		discrepancyCount: diffs.length,
		igvGap:
			sunatRecords.reduce((sum, r) => sum + r.igv, 0) -
			localRecords.reduce((sum, r) => sum + r.igv, 0),
	};

	return { discrepancies: diffs, stats };
}

const sireReconciliationMachine = createProcessMachine({
	id: "sireReconciliation",
	context: {
		sunatRecords: [] as SireRecord[],
		localRecords: [] as SireRecord[],
		discrepancies: [] as SireDiscrepancy[],
		stats: null as ReconciliationStats | null,
		error: null,
		pendingFile: null as File | null,
	},
	initial: "idle",
	onProcess: async (context) => {
		if (!context.pendingFile) throw new Error("No file provided");
		const sunatRecords = await parseSireFile(context.pendingFile);
		return { sunatRecords, pendingFile: null as File | null };
	},
	onAnalyze: async (context) => {
		const { discrepancies, stats } = calculateDiscrepancies(
			context.sunatRecords,
			context.localRecords,
		);
		return { discrepancies, stats };
	},
	states: {
		idle: {
			on: {
				PROCESS_FILE: {
					target: "processing",
					actions: assign({
						pendingFile: ({ event }: { event: unknown }) =>
							(event as { file: File }).file,
					}),
				},
			},
		},
		error: {
			on: {
				RETRY: { target: "idle" },
				PROCESS_FILE: {
					target: "processing",
					actions: assign({
						pendingFile: ({ event }: { event: unknown }) =>
							(event as { file: File }).file,
					}),
				},
			},
		},
	},
});

export const useSireReconciliation = () => {
	const [state, send] = useMachine(sireReconciliationMachine);

	const processFile = async (file: File) => {
		send({ type: "PROCESS_FILE", file });
	};

	const reset = () => {
		send({ type: "RESET" });
	};

	return {
		sunatRecords: state.context.sunatRecords,
		localRecords: state.context.localRecords,
		discrepancies: state.context.discrepancies,
		stats: state.context.stats,
		processFile,
		reset,
		isProcessing: state.matches("processing") || state.matches("analyzing"),
		state: state.value,
		error: state.context.error,
	};
};
