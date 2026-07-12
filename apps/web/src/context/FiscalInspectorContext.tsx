import type { FiscalActionContext, FiscalActionStatus } from "@drenyra/domain";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { useAgenticShell } from "@/stores/agentic-shell.store";

interface FiscalInspectorState {
	/** Whether the inspector panel is open */
	isOpen: boolean;
	/** Current fiscal action being inspected */
	activeAction: FiscalActionContext | null;
	/** History of recent actions (max 20) */
	recentActions: FiscalActionContext[];
}

interface FiscalInspectorContextType extends FiscalInspectorState {
	/** Open inspector with a specific action */
	open: (action: FiscalActionContext) => void;
	/** Update the action's status (triggers re-render in inspector) */
	updateStatus: (traceId: string, status: FiscalActionStatus) => void;
	/** Close the inspector */
	close: () => void;
	/** Toggle open/close */
	toggle: () => void;
	/** Clear all recent actions */
	clearHistory: () => void;
}

const FiscalInspectorContext = createContext<FiscalInspectorContextType | null>(
	null,
);

export function FiscalInspectorProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<FiscalInspectorState>({
		isOpen: false,
		activeAction: null,
		recentActions: [],
	});

	const openInspector = useAgenticShell((s) => s.openInspector);

	const open = useCallback(
		(action: FiscalActionContext) => {
			setState((prev) => ({
				isOpen: true,
				activeAction: action,
				recentActions: [
					action,
					...prev.recentActions
						.filter((a) => a.traceId !== action.traceId)
						.slice(0, 19),
				],
			}));

			// Sync with agentic-shell inspector panel so RightPanel opens
			openInspector({
				type: "fiscal",
				id: action.traceId,
				title: action.summary,
			});
		},
		[openInspector],
	);

	const updateStatus = useCallback(
		(traceId: string, status: FiscalActionStatus) => {
			setState((prev) => {
				const updateAction = (a: FiscalActionContext) =>
					a.traceId === traceId ? { ...a, status } : a;

				return {
					...prev,
					activeAction: prev.activeAction
						? updateAction(prev.activeAction)
						: null,
					recentActions: prev.recentActions.map(updateAction),
				};
			});
		},
		[],
	);

	const closeInspector = useAgenticShell((s) => s.closeInspector);

	const close = useCallback(() => {
		setState((prev) => ({ ...prev, isOpen: false }));
		closeInspector();
<<<<<<< HEAD
	}, []);
=======
	}, [closeInspector]);
>>>>>>> main

	const closeInspector = useAgenticShell((s) => s.closeInspector);

	const toggle = useCallback(() => {
		setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
	}, []);

	const clearHistory = useCallback(() => {
		setState((prev) => ({ ...prev, recentActions: [] }));
	}, []);

	return (
		<FiscalInspectorContext.Provider
			value={{ ...state, open, updateStatus, close, toggle, clearHistory }}
		>
			{children}
		</FiscalInspectorContext.Provider>
	);
}

export function useFiscalInspector(): FiscalInspectorContextType {
	const ctx = useContext(FiscalInspectorContext);
	if (!ctx) {
		throw new Error(
			"useFiscalInspector must be used within a FiscalInspectorProvider",
		);
	}
	return ctx;
}
