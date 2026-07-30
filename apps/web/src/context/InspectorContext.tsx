import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useAgenticShell } from "@/stores/agentic-shell.store";

// ─── Inspector subject type ──────────────────────────────────────────────────

/**
 * Union type for everything the right inspector panel can display.
 * Add new types as the workspace expands — each carries its own id.
 */
export type InspectorSubject =
	| { type: "evidence"; id: string; title: string }
	| { type: "journal-proposal"; id: string; title: string }
	| { type: "reconciliation"; id: string; title: string }
	| { type: "invoice"; id: string; title: string }
	| { type: "approval"; id: string; title: string }
	| { type: "fiscal"; id: string; title: string }
	| { type: "agent"; id: string; title: string }
	| { type: "diff"; id: string; title: string }
	| { type: "thread"; id: string; title: string };

// ─── Context value ───────────────────────────────────────────────────────────

interface InspectorContextValue {
	open: (subject: InspectorSubject) => void;
	close: () => void;
	isOpen: boolean;
	currentSubject: InspectorSubject | null;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * InspectorProvider — controls the right-side inspector panel.
 *
 * The inspector can display evidence, journal proposals, reconciliations,
 * invoices, approvals, fiscal analysis, agent reasoning, diffs, or threads.
 * Each is a discriminated union member of InspectorSubject.
 */
export function InspectorProvider({ children }: { children: ReactNode }) {
	const { openInspector, closeInspector, activeInspector } =
		useAgenticShell();

	const open = useCallback(
		(subject: InspectorSubject) => {
			openInspector({
				type: subject.type,
				id: subject.id,
				title: subject.title,
			});
		},
		[openInspector],
	);

	const close = useCallback(() => {
		closeInspector();
	}, [closeInspector]);

	return (
		<InspectorContext.Provider
			value={{
				open,
				close,
				isOpen: activeInspector !== null,
				currentSubject: activeInspector as InspectorSubject | null,
			}}
		>
			{children}
		</InspectorContext.Provider>
	);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useInspector(): InspectorContextValue {
	const ctx = useContext(InspectorContext);
	if (!ctx) {
		throw new Error("useInspector must be used within an InspectorProvider");
	}
	return ctx;
}
