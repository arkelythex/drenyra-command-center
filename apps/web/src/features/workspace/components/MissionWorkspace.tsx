import { useParams } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useAccountingMission } from "../hooks/useAccountingMission";
import { WorkspaceTopBar } from "@/components/workbench/WorkspaceTopBar";
import {
  MissionHeader,
  MissionStateView,
  MissionActions,
} from "./mission";

const CierreMensualPage = lazy(() =>
  import("@/features/cierre-mensual/CierreMensualPage").then((m) => ({
    default: m.CierreMensualPage,
  })),
);

export function MissionWorkspace() {
  const params = useParams({
    from: "/workspace/$companyId/$year/$month/$intent",
  });
  const mission = useAccountingMission();

  const handleStartMission = () => {
    mission.run({
      missionId: `close-${params.companyId}-${params.year}-${params.month}`,
      companyId: params.companyId,
      fiscalPeriod: `${params.year}-${params.month}`,
      intent: "monthly-close",
      input: { instruction: `Cierre mensual ${params.month}/${params.year}` },
      idempotencyKey: `${params.companyId}-${params.year}-${params.month}`,
      expectedMissionVersion: mission.version,
    });
  };

  const handleReject = (reason: string) => {
    mission.reject(reason || "Sin motivo especificado");
  };

  const isDraft = mission.status === ("DRAFT" as ReturnType<typeof useAccountingMission>["status"]);

  return (
    <div className="flex h-full flex-col">
      <WorkspaceTopBar />
      <div className="flex flex-1 overflow-hidden">
        {isDraft ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <div className="w-full flex-1 overflow-auto">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                  </div>
                }
              >
                <CierreMensualPage />
              </Suspense>
            </div>
            <div className="sticky bottom-0 flex w-full max-w-lg flex-col items-center gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
              <p className="text-xs text-[var(--text-muted)] text-center">
                Revisa el estado del cierre arriba. Cuando estés listo, inicia
                la misión para ejecutar operaciones contables.
              </p>
              <MissionActions
                status={mission.status}
                isReady={mission.isReady}
                isAwaiting={mission.isAwaiting}
                isFinished={mission.isFinished}
                onStart={handleStartMission}
                onReset={mission.reset}
                onRequestRevision={mission.requestRevision}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
            <MissionHeader
              status={mission.status}
              isMockMode={mission.isMockMode}
              elapsedMs={0}
            />

            <MissionStateView
              status={mission.status}
              progress={mission.progress}
              steps={mission.steps}
              currentStep={mission.currentStep}
              blockers={mission.blockers}
              proposal={mission.proposal}
              rejection={mission.rejection}
              receiptId={mission.receiptId}
              receiptHash={mission.receiptHash}
              isSubmitting={false}
              onApprove={mission.approve}
              onReject={handleReject}
              onReconcile={mission.reconcile}
              onRetry={handleStartMission}
            />

            <MissionActions
              status={mission.status}
              isReady={mission.isReady}
              isAwaiting={mission.isAwaiting}
              isFinished={mission.isFinished}
              onStart={handleStartMission}
              onReset={mission.reset}
              onRequestRevision={mission.requestRevision}
            />

            {mission.error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500">
                {mission.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
