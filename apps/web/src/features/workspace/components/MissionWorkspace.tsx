import { useParams } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { WorkspaceTopBar } from "@/components/workbench/WorkspaceTopBar";
import {
	fiscalPeriodFromParams,
	MONTHLY_CLOSE_INTENT,
} from "@/lib/close-workspace";
import { useAccountingMission } from "../hooks/useAccountingMission";
import { MissionActions, MissionHeader, MissionStateView } from "./mission";

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

	// The API only accepts YYYY-MM; a URL that names no real month starts nothing.
	const fiscalPeriod = fiscalPeriodFromParams(params.year, params.month);

	const handleStartMission = () => {
		if (!fiscalPeriod) return;
		// The API creates the mission for the session's company and returns its
		// id and version; nothing here is invented client-side.
		mission.run({
			fiscalPeriod,
			intent: MONTHLY_CLOSE_INTENT,
			input: { instruction: `Cierre mensual ${fiscalPeriod}` },
			idempotencyKey: `${params.companyId}-${fiscalPeriod}`,
		});
	};

	const handleReject = (reason: string) => {
		mission.reject(reason || "Sin motivo especificado");
	};

	const isDraft =
		mission.status ===
		("DRAFT" as ReturnType<typeof useAccountingMission>["status"]);

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
								<CierreMensualPage mission={mission} />
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
