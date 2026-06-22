import type {
	AddEvidenceRequest,
	DrenyraAgentType,
	FiscalCase,
	FiscalCaseDetails,
	FiscalCaseStatus,
} from "../api/drenyra-command-center.api";
import { FiscalCaseList } from "./fiscal-case-list";
import { FiscalCaseWorkspace } from "./fiscal-case-workspace";

export interface CommandCenterWorkGridProps {
	cases: FiscalCase[];
	selectedCaseId: string | null;
	isLoadingCases: boolean;
	details?: FiscalCaseDetails;
	selectedAgent: DrenyraAgentType;
	isBusy: boolean;
	isAddingEvidence: boolean;
	isUpdatingStatus: boolean;
	evidenceErrorMessage?: string;
	statusErrorMessage?: string;
	onCaseSelect: (caseId: string) => void;
	onSelectedAgentChange: (agent: DrenyraAgentType) => void;
	onRunAgent: () => void;
	onAddEvidence: (request: AddEvidenceRequest) => void;
	onUpdateStatus: (status: FiscalCaseStatus, reason?: string) => void;
	onRequestApproval: () => void;
	onSwitchToChat?: () => void;
}

export function CommandCenterWorkGrid({
	cases,
	selectedCaseId,
	isLoadingCases,
	details,
	selectedAgent,
	isBusy,
	isAddingEvidence,
	isUpdatingStatus,
	evidenceErrorMessage,
	statusErrorMessage,
	onCaseSelect,
	onSelectedAgentChange,
	onRunAgent,
	onAddEvidence,
	onUpdateStatus,
	onRequestApproval,
	onSwitchToChat,
}: CommandCenterWorkGridProps) {
	return (
		<div className="mt-5 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
			<FiscalCaseList
				cases={cases}
				selectedCaseId={selectedCaseId}
				isLoading={isLoadingCases}
				onSelect={onCaseSelect}
			/>
			<FiscalCaseWorkspace
				details={details}
				selectedAgent={selectedAgent}
				onSelectedAgentChange={onSelectedAgentChange}
				onRunAgent={onRunAgent}
				onAddEvidence={onAddEvidence}
				onUpdateStatus={onUpdateStatus}
				onRequestApproval={onRequestApproval}
				isBusy={isBusy}
				isAddingEvidence={isAddingEvidence}
				isUpdatingStatus={isUpdatingStatus}
				evidenceErrorMessage={evidenceErrorMessage}
				statusErrorMessage={statusErrorMessage}
				onSwitchToChat={onSwitchToChat}
			/>
		</div>
	);
}
