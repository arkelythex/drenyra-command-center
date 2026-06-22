import { useMachine } from "@xstate/react";
import { sireReconciliationMachine } from "../machines/sire-reconciliation.machine";

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
