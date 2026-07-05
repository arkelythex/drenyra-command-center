/**
 * CommandCenterChatHeader — Active Case Badge, action buttons, agent selector,
 * and density mode toggles for the Drenyra Command Center chat.
 *
 * @since Jun 2026
 */

import { FileText, Plus, Sparkles, ThumbsUp } from "lucide-react";
import type {
	DrenyraAgentType,
	FiscalCase,
	FiscalCaseStatus,
} from "../api/drenyra-command-center.api";
import { useTranslation } from "../i18n/i18n";
import type { DensityMode } from "./ArtifactCollapsible";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<FiscalCaseStatus, string> = {
	OPEN: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
	IN_REVIEW: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	APPROVAL_PENDING: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
	RESOLVED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
	ARCHIVED: "bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)]",
};

const RISK_COLORS: Record<string, string> = {
	LOW: "border-[var(--color-success)]/30 text-[var(--color-success)]",
	MEDIUM: "border-[var(--color-warning)]/30 text-[var(--color-warning)]",
	HIGH: "border-[var(--color-danger)]/30 text-[var(--color-danger)]",
	CRITICAL: "border-[var(--color-danger)]/60 text-[var(--color-danger)]",
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface CommandCenterChatHeaderProps {
	activeCase: FiscalCase | null;
	activeThreadId: string;
	companyId: string;
	densityMode: DensityMode;
	selectedAgent: DrenyraAgentType;
	showEvidenceForm: boolean;
	showNewCaseForm: boolean;
	selectedCaseId: string | null;
	isBusy: boolean;
	onDensityModeChange: (mode: DensityMode) => void;
	onSelectedAgentChange?: (agent: DrenyraAgentType) => void;
	onRunAgent: () => void;
	onRequestApproval: () => void;
	onSelectCase: (caseId: string) => void;
	onToggleEvidenceForm: () => void;
	onToggleNewCaseForm: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CommandCenterChatHeader({
	activeCase,
	activeThreadId,
	companyId,
	densityMode,
	selectedAgent,
	showEvidenceForm,
	showNewCaseForm,
	selectedCaseId,
	isBusy,
	onDensityModeChange,
	onSelectedAgentChange,
	onRunAgent,
	onRequestApproval,
	onSelectCase,
	onToggleEvidenceForm,
	onToggleNewCaseForm,
}: CommandCenterChatHeaderProps) {
	const { t } = useTranslation();
	const STATUS_LABELS: Record<FiscalCaseStatus, string> = {
		OPEN: t("chat.case.status.open"),
		IN_REVIEW: t("chat.case.status.review"),
		APPROVAL_PENDING: t("chat.case.status.approval"),
		RESOLVED: t("chat.case.status.resolved"),
		ARCHIVED: t("chat.case.status.archived"),
	};

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/50 px-4 py-3">
			{/* Active Case Badge */}
			<div className="flex items-center gap-3 min-w-0">
				{activeCase ? (
					<>
						<div
							className={`inline-flex items-center gap-2 rounded-lg border bg-[var(--surface-1)] px-3 py-1.5 ${RISK_COLORS[activeCase.riskLevel] ?? RISK_COLORS.MEDIUM}`}
							aria-label={`Caso: ${activeCase.title}. Riesgo: ${activeCase.riskLevel}. Estado: ${STATUS_LABELS[activeCase.status]}`}
						>
							<span className="text-xs font-bold tracking-tight truncate max-w-[180px]">
								{activeCase.title}
							</span>
							<span
								className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${STATUS_COLORS[activeCase.status]}`}
							>
								{STATUS_LABELS[activeCase.status]}
							</span>
						</div>
						<button
							type="button"
							onClick={() => onSelectCase(selectedCaseId!)}
							className="text-2xs font-semibold text-[var(--color-info)] hover:text-[var(--color-info)]/80 transition-colors shrink-0"
						>
							{t("chat.case.change")}
						</button>
					</>
				) : (
					<span className="text-xs text-[var(--text-tertiary)] italic">
						{t("chat.case.noSelection")}
					</span>
				)}
			</div>

			{/* Thread indicator */}
			{activeThreadId !== "main" && (
				<span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning)]/10 px-2.5 py-0.5 text-2xs font-semibold text-[var(--color-warning)]">
					{t("thread.indicator")}{" "}
					{JSON.parse(
						localStorage.getItem("drenyra:threads:" + companyId) || "{}",
					)[activeThreadId]?.name || "..."}
				</span>
			)}

			{/* Action Buttons */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Run Agent */}
				<button
					type="button"
					onClick={onRunAgent}
					disabled={!selectedCaseId || isBusy}
					className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none"
					aria-label="Ejecutar agente fiscal"
				>
					<Sparkles size={14} aria-hidden="true" />
					{t("actions.runAgent")}
				</button>

				{/* Upload Evidence */}
				<button
					type="button"
					data-action="upload-evidence"
					onClick={onToggleEvidenceForm}
					disabled={!selectedCaseId}
					className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${
						showEvidenceForm
							? "border-[var(--color-info)]/40 bg-[var(--color-info)]/10 text-[var(--color-info)]"
							: "border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
					}`}
					aria-label="Adjuntar evidencia"
				>
					<FileText size={14} aria-hidden="true" />
					{t("actions.upload")}
				</button>

				{/* New Case */}
				<button
					type="button"
					onClick={onToggleNewCaseForm}
					className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${
						showNewCaseForm
							? "border-[var(--color-info)]/40 bg-[var(--color-info)]/10 text-[var(--color-info)]"
							: "border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
					}`}
					aria-label="Crear nuevo caso fiscal"
				>
					<Plus size={14} aria-hidden="true" />
					{t("actions.newCase")}
				</button>

				{/* Request Approval */}
				<button
					type="button"
					onClick={onRequestApproval}
					disabled={!selectedCaseId || isBusy}
					className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none"
					aria-label="Solicitar aprobación"
				>
					<ThumbsUp size={14} aria-hidden="true" />
					{t("actions.approval")}
				</button>
			</div>

			{/* Agent selector */}
			<div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-3 ml-1">
				<select
					value={selectedAgent}
					onChange={(e) =>
						onSelectedAgentChange?.(e.target.value as DrenyraAgentType)
					}
					className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-2xs font-semibold text-[var(--text-secondary)] outline-none focus:border-[var(--color-info)]/50"
					aria-label="Seleccionar agente"
				>
					<option value="LEDGER_AGENT">📒 Ledger</option>
					<option value="SIRE_AGENT">📋 SIRE</option>
					<option value="CPE_AGENT">🧾 CPE</option>
					<option value="CONCILIATION_AGENT">🔄 Conciliación</option>
					<option value="FISCAL_REVIEWER_AGENT">🔍 Reviewer</option>
					<option value="EVIDENCE_AGENT">📎 Evidencia</option>
				</select>
			</div>

			{/* Density mode */}
			<div
				className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-3 ml-1"
				role="tablist"
				aria-label="Modo de densidad"
			>
				<button
					type="button"
					role="tab"
					aria-selected={densityMode === "compact"}
					onClick={() => onDensityModeChange("compact")}
					className={`rounded px-2 py-1 text-2xs font-semibold transition-colors ${
						densityMode === "compact"
							? "bg-[var(--color-info)]/10 text-[var(--color-info)]"
							: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
					}`}
					title={t("density.compact")}
				>
					{t("density.compact")}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={densityMode === "detail"}
					onClick={() => onDensityModeChange("detail")}
					className={`rounded px-2 py-1 text-2xs font-semibold transition-colors ${
						densityMode === "detail"
							? "bg-[var(--color-info)]/10 text-[var(--color-info)]"
							: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
					}`}
					title={t("density.detail")}
				>
					{t("density.detail")}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={densityMode === "numbers-only"}
					onClick={() => onDensityModeChange("numbers-only")}
					className={`rounded px-2 py-1 text-2xs font-semibold transition-colors ${
						densityMode === "numbers-only"
							? "bg-[var(--color-info)]/10 text-[var(--color-info)]"
							: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
					}`}
					title={t("density.numbers")}
				>
					{t("density.numbers")}
				</button>
			</div>
		</div>
	);
}
