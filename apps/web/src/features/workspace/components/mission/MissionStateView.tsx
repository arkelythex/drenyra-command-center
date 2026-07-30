import { CheckCircle, XCircle } from "lucide-react";
import type { AccountingMissionStatus, MissionBlocker, MissionProposal, MissionRejection, MissionStep } from "@drenyra/mission-domain";
import { MissionProgress } from "./MissionProgress";
import { MissionBlockedState } from "./MissionBlockedState";
import { MissionUnknownState } from "./MissionUnknownState";
import { MissionApprovalGate } from "./MissionApprovalGate";
import { MissionReceipt } from "./MissionReceipt";

interface MissionStateViewProps {
  status: AccountingMissionStatus;
  progress: number;
  steps: MissionStep[];
  currentStep: string;
  blockers: MissionBlocker[];
  proposal: MissionProposal | null;
  rejection: MissionRejection | null;
  receiptId: string | null;
  receiptHash: string | null;
  isSubmitting: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onReconcile: (resolution: string, reason: string) => void;
  onRetry: () => void;
}

export function MissionStateView({
  status,
  progress,
  steps,
  currentStep,
  blockers,
  proposal,
  rejection,
  receiptId,
  receiptHash,
  isSubmitting,
  onApprove,
  onReject,
  onReconcile,
  onRetry,
}: MissionStateViewProps) {
  const isRunningLike =
    status === ("QUEUED" as AccountingMissionStatus) ||
    status === ("RUNNING" as AccountingMissionStatus);

  if (status === ("DRAFT" as AccountingMissionStatus)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-xs text-[var(--text-muted)]">
          Listo para iniciar. Revisa los datos y presiona &quot;Iniciar misión&quot;.
        </p>
      </div>
    );
  }

  if (isRunningLike || status === ("BLOCKED" as AccountingMissionStatus)) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
        <MissionProgress
          progress={progress}
          steps={steps}
          currentStep={currentStep}
        />
        {blockers.length > 0 && (
          <MissionBlockedState blockers={blockers} onRetry={onRetry} />
        )}
      </div>
    );
  }

  if (status === ("AWAITING_APPROVAL" as AccountingMissionStatus) && proposal) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
        <MissionProgress
          progress={progress}
          steps={steps}
          currentStep={currentStep}
        />
        <MissionApprovalGate
          proposal={proposal}
          onApprove={onApprove}
          onReject={onReject}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  if (status === ("APPROVED" as AccountingMissionStatus) && receiptId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <MissionReceipt
          receiptId={receiptId}
          receiptHash={receiptHash ?? ""}
          onCopy={() => {
            navigator.clipboard.writeText(receiptId).catch(() => {});
          }}
        />
      </div>
    );
  }

  if (status === ("REJECTED" as AccountingMissionStatus)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <XCircle size={32} className="mx-auto text-red-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Propuesta rechazada
          </h3>
          {rejection && (
            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <p>{rejection.reason}</p>
              <p className="text-[10px]">
                {rejection.rejectedBy} · {rejection.rejectedAt}
                {rejection.proposalVersion > 0 && ` · v${rejection.proposalVersion}`}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === ("COMPLETED" as AccountingMissionStatus)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <CheckCircle size={32} className="mx-auto text-green-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Misión completada
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            La operación se ha procesado exitosamente.
          </p>
        </div>
      </div>
    );
  }

  if (status === ("FAILED" as AccountingMissionStatus)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <XCircle size={32} className="mx-auto text-red-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Misión fallida
          </h3>
        </div>
      </div>
    );
  }

  if (status === ("UNKNOWN" as AccountingMissionStatus)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <MissionUnknownState
          onReconcile={onReconcile}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return null;
}
