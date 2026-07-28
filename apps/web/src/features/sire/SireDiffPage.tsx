import { Link } from "@tanstack/react-router";
import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DiffViewerV3 } from "@/components/agentic/DiffViewerV3";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageShell } from "@/components/ui/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { persistArtifactGovernanceEvent } from "@/features/artifacts/api/artifact-governance-audit.api";
import { SireDiffArtifactCard } from "@/features/artifacts/components/SireDiffArtifactCard";
import type {
	ArtifactInteractionEvent,
} from "@/features/artifacts/types/artifact.types";
import { buildExpedienteEvidenceHref } from "./buildExpedienteEvidenceHref";
import { useSireDiffMutation } from "./hooks/useSireDiff";
import { mapSireDiffResponseToArtifact } from "./mapSireDiffResponseToArtifact";
import { useSireDiffWorkspaceStore } from "./stores/sire-diff-workspace.store";

export function SireDiffPage() {
	// URL-based recovery (REQ-E-002) — read period from search params
	const initialPeriod = useMemo(() => {
		if (typeof window === "undefined") return undefined;
		const params = new URLSearchParams(window.location.search);
		return params.get("period") ?? undefined;
	}, []);

	// Workspace store (REQ-E-001)
	const workspacePeriod = useSireDiffWorkspaceStore((s) => s.period);
	const workspaceArtifact = useSireDiffWorkspaceStore((s) => s.artifact);
	const workspaceIsLoading = useSireDiffWorkspaceStore((s) => s.isLoading);
	const workspaceError = useSireDiffWorkspaceStore((s) => s.error);
	const setPeriod = useSireDiffWorkspaceStore((s) => s.setPeriod);
	const setArtifact = useSireDiffWorkspaceStore((s) => s.setArtifact);
	const setLoading = useSireDiffWorkspaceStore((s) => s.setLoading);
	const setError = useSireDiffWorkspaceStore((s) => s.setError);
	const clearError = useSireDiffWorkspaceStore((s) => s.clearError);

	// Restore period from URL on mount (REQ-E-002)
	useEffect(() => {
		if (initialPeriod) {
			setPeriod(initialPeriod);
		}
	}, [initialPeriod, setPeriod]);

	const [sireFile, setSireFile] = useState<File | undefined>();
	const [cpeFile, setCpeFile] = useState<File | undefined>();

	const diffMutation = useSireDiffMutation();

	// Sync mutation pending state to workspace loading
	useEffect(() => {
		setLoading(diffMutation.isPending);
	}, [diffMutation.isPending, setLoading]);

	const evidenceHref = useMemo(
		() => buildExpedienteEvidenceHref({ period: workspacePeriod, kind: "sire" }),
		[workspacePeriod],
	);

	const handleRunDiff = useCallback(async () => {
		clearError();
		try {
			const payload = await diffMutation.mutateAsync({
				period: workspacePeriod,
				sireFile,
				cpeFile,
			});
			const mapped = mapSireDiffResponseToArtifact(payload);
			setArtifact(mapped as any);
			toast.success("Conciliación SIRE generada");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to build SIRE diff";
			setError(message);
			toast.error(message);
		}
	}, [
		diffMutation,
		workspacePeriod,
		sireFile,
		cpeFile,
		setArtifact,
		setError,
		clearError,
	]);

	const handleRetry = useCallback(() => {
		void handleRunDiff();
	}, [handleRunDiff]);

	const handleArtifactEvent = (event: ArtifactInteractionEvent) => {
		void persistArtifactGovernanceEvent(event).catch(() => {
			toast.error("Failed to persist governance event");
		});
	};

	// Determine if this is an "all match" empty state
	const isAllMatch =
		workspaceArtifact != null &&
		workspaceArtifact.data.summary.mismatched === 0 &&
		workspaceArtifact.data.summary.missingOnLedger === 0 &&
		workspaceArtifact.data.summary.missingOnSunat === 0;

	return (
		<PageShell>
			<header className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Conciliación SIRE
				</h1>
				<p className="text-sm text-muted-foreground">
					Conciliación de tres vías: ledger local vs propuesta SUNAT vs CPE
					opcional.
				</p>
			</header>
			<div className="space-y-6">
				{/* Input form */}
				<div className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
					<label className="space-y-1 text-sm">
						<span className="font-medium">Periodo (YYYY-MM)</span>
						<input
							className="h-10 w-full rounded-xl border border-border bg-background px-3"
							value={workspacePeriod}
							onChange={(event) => setPeriod(event.target.value)}
						/>
					</label>
					<label className="space-y-1 text-sm">
						<span className="font-medium">Archivo propuesta SIRE</span>
						<input
							type="file"
							className="block w-full text-xs"
							onChange={(event) =>
								setSireFile(event.target.files?.[0] ?? undefined)
							}
						/>
					</label>
					<label className="space-y-1 text-sm">
						<span className="font-medium">Archivo CPE (opcional)</span>
						<input
							type="file"
							className="block w-full text-xs"
							onChange={(event) =>
								setCpeFile(event.target.files?.[0] ?? undefined)
							}
						/>
					</label>
					<div className="flex items-end">
						<Button
							type="button"
							onClick={() => void handleRunDiff()}
							disabled={diffMutation.isPending}
							className="w-full"
						>
							{diffMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<FileUp className="mr-2 h-4 w-4" />
							)}
							Ejecutar conciliación
						</Button>
					</div>
				</div>

				{/* Warning bar */}
				<div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<AlertTriangle className="h-4 w-4" />
						Revisar discrepancias antes de enviar a SUNAT.
					</div>
					<Link to={evidenceHref} className="text-primary hover:underline">
						Abrir evidencia de expediente
					</Link>
				</div>

				{/* LOADING STATE (REQ-E-004) */}
				{workspaceIsLoading && !workspaceArtifact ? (
					<div
						className="space-y-4 rounded-2xl border border-border p-6"
						role="status"
						aria-label="Computing SIRE diff"
					>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-96" />
						<div className="space-y-2 pt-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>
				) : null}

				{/* ERROR STATE (REQ-E-004) — preserves previous artifact */}
				{workspaceError ? (
					<ErrorState
						message={workspaceError}
						actionLabel="Reintentar"
						onAction={handleRetry}
					/>
				) : null}

				{/* EMPTY STATE (REQ-E-004) — all records match */}
				{workspaceArtifact && isAllMatch && !workspaceError ? (
					<div className="rounded-2xl border border-[var(--color-success-border)]/20 bg-[var(--color-success-bg)]/10 p-8 text-center">
						<p className="text-lg font-semibold text-[var(--color-success-text)]">
							Todos los registros coinciden — sin discrepancias
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							La conciliación SIRE no encontró diferencias entre el ledger
							local y la propuesta SUNAT.
						</p>
					</div>
				) : null}

				{/* ARTIFACT CONTENT — renders even during error (REQ-E-004) */}
				{workspaceArtifact ? (
					<>
						<SireDiffArtifactCard
							artifact={workspaceArtifact}
							onEvent={handleArtifactEvent}
						/>
						<DiffViewerV3
							title="Resumen de conciliación"
							lines={[
								{
									type: "context",
									content: `Coinciden: ${workspaceArtifact.data.summary.matched}`,
								},
								{
									type: "context",
									content: `Discrepancias: ${workspaceArtifact.data.summary.mismatched}`,
								},
								{
									type: "context",
									content: `Faltante en ledger: ${workspaceArtifact.data.summary.missingOnLedger}`,
								},
								{
									type: "context",
									content: `Faltante en SUNAT: ${workspaceArtifact.data.summary.missingOnSunat}`,
								},
								{
									type:
										workspaceArtifact.data.summary.critical > 0
											? "remove"
											: "add",
									content: `Filas críticas: ${workspaceArtifact.data.summary.critical}`,
								},
							]}
						/>
					</>
				) : null}
			</div>
		</PageShell>
	);
}
