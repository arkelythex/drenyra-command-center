import { useMachine } from "@xstate/react";
import { assign } from "xstate";
import { createProcessMachine } from "@/lib/process-machine";
import { parseSireFile } from "../services/sire-parser";
import { reconcileSire } from "../services/sire-reconciliation";
import type {
	ReconciliationStats,
	SireDiscrepancy,
	SireRecord,
} from "../types/sire.types";

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
		const { discrepancies, stats } = reconcileSire(
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
