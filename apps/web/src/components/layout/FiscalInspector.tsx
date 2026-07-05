import { AnimatePresence, motion } from "framer-motion";
import { useFiscalInspector } from "@/context/FiscalInspectorContext";
import { FiscalInspectorDetail } from "./components/FiscalInspectorDetail";
import { FiscalInspectorHistory } from "./components/FiscalInspectorHistory";

/**
 * Fiscal Inspector — slide-over panel for reviewing fiscal actions.
 *
 * Shows either the detail view of an active action or the history list.
 * Animated open/close via framer-motion AnimatePresence.
 */
export function FiscalInspector() {
	const { isOpen, activeAction, recentActions, close, open, clearHistory } =
		useFiscalInspector();

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.aside
					initial={{ width: 0, opacity: 0 }}
					animate={{ width: 380, opacity: 1 }}
					exit={{ width: 0, opacity: 0 }}
					transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
					className="relative flex h-full flex-col overflow-hidden border-l border-[var(--color-stroke-1)] bg-[var(--color-bg-0)]"
				>
					<div className="flex h-full w-[380px] flex-col">
						{activeAction ? (
							<FiscalInspectorDetail action={activeAction} onClose={close} />
						) : (
							<FiscalInspectorHistory
								actions={recentActions}
								onSelect={open}
								onClose={close}
								onClear={clearHistory}
							/>
						)}
					</div>
				</motion.aside>
			)}
		</AnimatePresence>
	);
}

export { FiscalInspectorAgentAnalysis } from "./components/FiscalInspectorAgentAnalysis";
export { FiscalInspectorApproval } from "./components/FiscalInspectorApproval";
// Re-export sub-components and utilities for consumers that may need them.
export { FiscalInspectorDetail } from "./components/FiscalInspectorDetail";
export { FiscalInspectorEvidence } from "./components/FiscalInspectorEvidence";
export { FiscalInspectorHistory } from "./components/FiscalInspectorHistory";
export { FiscalInspectorPipeline } from "./components/FiscalInspectorPipeline";
export { FiscalInspectorRiskBadge } from "./components/FiscalInspectorRiskBadge";
export { FiscalInspectorSection } from "./components/FiscalInspectorSection";
export { RISK_BG } from "./FiscalInspector.data";
export type {
	AgentAnalysisProps,
	ApprovalSectionProps,
	DetailHeaderProps,
	EvidenceListProps,
	HistoryListProps,
	PipelineProps,
	RiskBadgeProps,
	SectionProps,
} from "./FiscalInspector.types";
