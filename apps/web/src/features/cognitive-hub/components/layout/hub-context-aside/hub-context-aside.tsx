import { useState } from "react";
import { getLegacyUserId } from "@/lib/api";
import { useAccountingJobRuns } from "../../hooks/useAccountingJobRuns";
import { buildIntegrationStatus } from "../hub-right-rail.constants";
import { ContextDocumentsSection } from "./components/ContextDocumentsSection";
import { ContextIntegrationSection } from "./components/ContextIntegrationSection";
import { ContextRunsSection } from "./components/ContextRunsSection";
import { ContextSkillsSection } from "./components/ContextSkillsSection";
import type {
	HubContextAsideProps,
	RunFilter,
} from "./hub-context-aside.types";

export function HubContextAside({
	showHistory,
	isSwarmStreaming,
	skills,
	documents,
	onInstallSkill,
}: HubContextAsideProps) {
	const { runs, isLoadingRuns, updateJobRunStatus, isUpdatingJobRun } =
		useAccountingJobRuns(5, {
			includeControlPlane: false,
		});
	const [runFilter, setRunFilter] = useState<RunFilter>("ALL");

	const integrations = buildIntegrationStatus(isSwarmStreaming);

	const handleApproveRun = (runId: string, jobTitle: string) => {
		void updateJobRunStatus({
			runId,
			status: "RUNNING",
			approvedBy: getLegacyUserId(),
			summary: `${jobTitle} aprobado manualmente`,
			resultPayload: { approval: "approved", source: "hub-right-rail" },
			evidencePayload: { actor: getLegacyUserId(), source: "hub-right-rail" },
		}).catch(() => {});
	};

	const handleRejectRun = (runId: string, jobTitle: string) => {
		void updateJobRunStatus({
			runId,
			status: "CANCELLED",
			summary: `${jobTitle} rechazado manualmente`,
			resultPayload: { approval: "rejected", source: "hub-right-rail" },
			evidencePayload: { actor: getLegacyUserId(), source: "hub-right-rail" },
		}).catch(() => {});
	};

	return (
		<div className="flex h-full flex-col">
			<div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-5">
				<ContextIntegrationSection integrations={integrations} />

				<ContextSkillsSection skills={skills} onInstallSkill={onInstallSkill} />

				<ContextDocumentsSection documents={documents} />

				<ContextRunsSection
					runs={runs}
					runFilter={runFilter}
					isLoadingRuns={isLoadingRuns}
					isUpdatingJobRun={isUpdatingJobRun}
					onFilterChange={setRunFilter}
					onApprove={handleApproveRun}
					onReject={handleRejectRun}
				/>
			</div>
		</div>
	);
}
