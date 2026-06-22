import type { FiscalActionContext } from "@arkelythex/domain";

export interface DetailHeaderProps {
	action: FiscalActionContext;
	onClose: () => void;
}

export interface HistoryHeaderProps {
	onClose: () => void;
}

export interface HistoryListProps {
	actions: FiscalActionContext[];
	onSelect: (action: FiscalActionContext) => void;
	onClose: () => void;
	onClear: () => void;
}

export interface SectionProps {
	title: string;
	children: React.ReactNode;
}

export interface RiskBadgeProps {
	riskLevel: FiscalActionContext["riskLevel"];
	impact: string;
}

export interface PipelineProps {
	status: FiscalActionContext["status"];
}

export interface AgentAnalysisProps {
	analysis: NonNullable<FiscalActionContext["agentAnalysis"]>;
}

export interface EvidenceListProps {
	evidence: FiscalActionContext["evidence"];
}

export interface ApprovalSectionProps {
	requiredApprovers: NonNullable<FiscalActionContext["requiredApprovers"]>;
	approvedBy: FiscalActionContext["approvedBy"];
}
