import { Bot, MessageSquare, Play, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DRENYRA_AGENTS } from "@/lib/agents";
import type {
	AddEvidenceRequest,
	DrenyraAgentType,
	FiscalCaseDetails,
	FiscalCaseStatus,
} from "../api/drenyra-command-center.api";
import { AgentRunPanel } from "./agent-run-panel";
import { CaseStatusControl } from "./case-status-control";
import { EvidenceAttachmentForm } from "./EvidenceAttachmentForm";
import { Metric } from "./metric";

export function FiscalCaseWorkspace({
	details,
	selectedAgent,
	onSelectedAgentChange,
	onRunAgent,
	onAddEvidence,
	onUpdateStatus,
	onRequestApproval,
	isBusy,
	isAddingEvidence,
	isUpdatingStatus,
	evidenceErrorMessage,
	statusErrorMessage,
	onSwitchToChat,
}: {
	details?: FiscalCaseDetails;
	selectedAgent: DrenyraAgentType;
	onSelectedAgentChange: (agent: DrenyraAgentType) => void;
	onRunAgent: () => void;
	onAddEvidence: (request: AddEvidenceRequest) => void;
	onUpdateStatus: (status: FiscalCaseStatus, reason?: string) => void;
	onRequestApproval: () => void;
	isBusy: boolean;
	isAddingEvidence: boolean;
	isUpdatingStatus: boolean;
	evidenceErrorMessage?: string;
	statusErrorMessage?: string;
	onSwitchToChat?: () => void;
}) {
	return (
		<section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
			{!details ? (
				<div className="flex min-h-[460px] items-center justify-center text-sm text-[var(--text-tertiary)]">
					Creá o seleccioná un caso fiscal.
				</div>
			) : (
				<div className="space-y-5">
					<div>
						<p className="text-2xs font-bold uppercase tracking-widest text-[var(--color-info)]">
							Caso activo
						</p>
						<h3 className="mt-1 text-2xl font-bold">{details.case.title}</h3>
						<p className="mt-2 text-sm text-[var(--text-secondary)]">
							{details.case.description}
						</p>
					</div>
					<div className="grid gap-3 md:grid-cols-3">
						<Metric
							label="Evidencias"
							value={String(details.evidence.length)}
						/>
						<Metric
							label="Agent runs"
							value={String(details.agentRuns.length)}
						/>
						<Metric
							label="Audit events"
							value={String(details.auditEvents.length)}
						/>
					</div>
					<CaseStatusControl
						key={details.case.id}
						currentStatus={details.case.status}
						onSubmit={onUpdateStatus}
						isPending={isUpdatingStatus}
						errorMessage={statusErrorMessage}
					/>
					<EvidenceAttachmentForm
						onSubmit={onAddEvidence}
						isPending={isAddingEvidence}
						isDisabled={!details}
						errorMessage={evidenceErrorMessage}
					/>
					<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
						<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
							<h4 className="flex items-center gap-2 text-sm font-bold">
								<Bot size={16} />
								Agentes fiscales mock
							</h4>
							<select
								aria-label="Seleccionar agente"
								value={selectedAgent}
								onChange={(event) =>
									onSelectedAgentChange(event.target.value as DrenyraAgentType)
								}
								className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs"
							>
								{DRENYRA_AGENTS.map((agent) => (
									<option key={agent.id} value={agent.id}>
										{agent.label}
									</option>
								))}
							</select>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button size="sm" onClick={onRunAgent} disabled={isBusy}>
								<Play size={14} className="mr-1" />
								Iniciar mock agent
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={onRequestApproval}
								disabled={isBusy}
							>
								<ShieldAlert size={14} className="mr-1" />
								Solicitar aprobación
							</Button>
						</div>
					</div>
					<AgentRunPanel runs={details.agentRuns} />

					{/* Invitación al Chat Fiscal — reemplaza el placeholder anterior */}
					<div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]/50 p-4">
						<div className="flex items-start gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-info)]/10">
								<MessageSquare size={18} className="text-[var(--color-info)]" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-bold text-[var(--text-primary)]">
									Chat Fiscal con Agentes IA
								</p>
								<p className="mt-1 text-xs text-[var(--text-secondary)]">
									Usá el chat conversacional para pedir análisis de riesgo,
									preparar SIRE, conciliar bancos o revisar documentación
									fiscal. Los resultados pueden crear o actualizar casos.
								</p>
								{onSwitchToChat && (
									<Button
										size="sm"
										variant="outline"
										className="mt-3"
										onClick={onSwitchToChat}
									>
										<MessageSquare size={14} className="mr-1" />
										Abrir Chat Fiscal
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
