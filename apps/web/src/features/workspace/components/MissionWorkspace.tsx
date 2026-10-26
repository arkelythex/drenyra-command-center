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
	const isFailed =
		mission.status ===
		("FAILED" as ReturnType<typeof useAccountingMission>["status"]);

	return (
		<div className="flex h-full flex-col">
			<WorkspaceTopBar />
			<div className="flex flex-1 overflow-hidden">
				{isDraft ? (
					<div className="flex min-h-0 flex-1 flex-col">
						<Suspense
							fallback={
								<div className="flex flex-1 items-center justify-center">
									<div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent motion-reduce:animate-none" />
								</div>
							}
						>
							<CierreMensualPage mission={mission} />
						</Suspense>
						<footer className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
							<p className="text-sm text-muted-foreground">
								Revisa el estado del cierre. Cuando estés listo, inicia la
								misión para ejecutar las operaciones contables.
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
						</footer>
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
							error={mission.error}
							onReset={mission.reset}
						/>

						{/* The failed state renders its own actions and error details. */}
						{!isFailed && (
							<MissionActions
								status={mission.status}
								isReady={mission.isReady}
								isAwaiting={mission.isAwaiting}
								isFinished={mission.isFinished}
								onStart={handleStartMission}
								onReset={mission.reset}
								onRequestRevision={mission.requestRevision}
							/>
						)}

						{mission.error && !isFailed && (
							<div
								role="alert"
								className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
							>
								{mission.error}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
