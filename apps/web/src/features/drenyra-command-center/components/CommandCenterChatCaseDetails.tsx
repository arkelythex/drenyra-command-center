/**
 * CommandCenterChatCaseDetails — Expandable case details panel for the
 * Drenyra Command Center chat, showing description, metrics, and status
 * control for the active fiscal case.
 *
 * @since Jun 2026
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import type {
	FiscalCase,
	FiscalCaseDetails,
	FiscalCaseStatus,
} from "../api/drenyra-command-center.api";
import { useTranslation } from "../i18n/i18n";
import { Metric } from "./metric";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<FiscalCaseStatus, string> = {
	OPEN: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
	IN_REVIEW: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	APPROVAL_PENDING: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
	RESOLVED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
	ARCHIVED: "bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)]",
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface CommandCenterChatCaseDetailsProps {
	activeCase: FiscalCase;
	details: FiscalCaseDetails;
	isBusy: boolean;
	showDetails: boolean;
	onToggleDetails: () => void;
	onUpdateStatus: (status: FiscalCaseStatus, reason?: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CommandCenterChatCaseDetails({
	activeCase,
	details,
	isBusy,
	showDetails,
	onToggleDetails,
	onUpdateStatus,
}: CommandCenterChatCaseDetailsProps) {
	const { t } = useTranslation();
	const STATUS_LABELS: Record<FiscalCaseStatus, string> = {
		OPEN: t("chat.case.status.open"),
		IN_REVIEW: t("chat.case.status.review"),
		APPROVAL_PENDING: t("chat.case.status.approval"),
		RESOLVED: t("chat.case.status.resolved"),
		ARCHIVED: t("chat.case.status.archived"),
	};

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
			<button
				type="button"
				onClick={onToggleDetails}
				className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
				aria-expanded={showDetails}
				aria-controls="case-details-panel"
			>
				<div className="flex items-center gap-3">
					{showDetails ? (
						<ChevronDown
							size={16}
							className="text-[var(--text-tertiary)]"
							aria-hidden="true"
						/>
					) : (
						<ChevronRight
							size={16}
							className="text-[var(--text-tertiary)]"
							aria-hidden="true"
						/>
					)}
					<span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
						{t("chat.case.details")}
					</span>
					<span className="text-xs text-[var(--text-secondary)]">
						{details.case.title}
					</span>
				</div>
				<span className="text-2xs text-[var(--text-tertiary)]">
					{details.evidence.length} evid. · {details.agentRuns.length} runs ·{" "}
					{details.auditEvents.length} eventos
				</span>
			</button>

			{showDetails && (
				<div
					id="case-details-panel"
					className="border-t border-[var(--border-subtle)] p-4 space-y-4"
				>
					{/* Description */}
					<div>
						<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
							Descripción
						</p>
						<p className="mt-1 text-sm text-[var(--text-secondary)]">
							{details.case.description}
						</p>
					</div>

					{/* Metrics */}
					<div className="grid grid-cols-3 gap-3">
						<Metric
							label="Evidencias"
							value={String(details.evidence.length)}
						/>
						<Metric
							label="Agent Runs"
							value={String(details.agentRuns.length)}
						/>
						<Metric
							label="Audit Events"
							value={String(details.auditEvents.length)}
						/>
					</div>

					{/* Status Control */}
					<div>
						<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
							Estado
						</p>
						<div className="flex flex-wrap gap-2">
							{(Object.keys(STATUS_LABELS) as FiscalCaseStatus[]).map(
								(status) => (
									<button
										key={status}
										type="button"
										onClick={() => onUpdateStatus(status)}
										disabled={isBusy || status === details.case.status}
										aria-current={
											status === details.case.status ? "true" : undefined
										}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
											status === details.case.status
												? `${STATUS_COLORS[status]} ring-1 ring-inset ring-current`
												: "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
										}`}
									>
										{STATUS_LABELS[status]}
									</button>
								),
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
