import { Link } from "@tanstack/react-router";
import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DiffViewerV3 } from "@/components/agentic/DiffViewerV3";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/PageShell";
import { persistArtifactGovernanceEvent } from "@/features/artifacts/api/artifact-governance-audit.api";
import { SireDiffArtifactCard } from "@/features/artifacts/components/SireDiffArtifactCard";
import type {
	ArtifactInteractionEvent,
	SireDiffArtifact,
} from "@/features/artifacts/types/artifact.types";
import { useSireDiffMutation } from "./hooks/useSireDiff";
import { mapSireDiffResponseToArtifact } from "./mapSireDiffResponseToArtifact";
import { buildExpedienteEvidenceHref } from "./buildExpedienteEvidenceHref";

export function SireDiffPage() {
	const [period, setPeriod] = useState("2026-03");
	const [sireFile, setSireFile] = useState<File | undefined>();
	const [cpeFile, setCpeFile] = useState<File | undefined>();
	const [artifact, setArtifact] = useState<SireDiffArtifact | null>(null);

	const diffMutation = useSireDiffMutation();

	const evidenceHref = useMemo(
		() => buildExpedienteEvidenceHref({ period, kind: "sire" }),
		[period],
	);

	const handleRunDiff = async () => {
		try {
			const payload = await diffMutation.mutateAsync({
				period,
				sireFile,
				cpeFile,
			});
			setArtifact(mapSireDiffResponseToArtifact(payload));
			toast.success("SIRE three-way diff generated");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to build SIRE diff",
			);
		}
	};

	const handleArtifactEvent = (event: ArtifactInteractionEvent) => {
		void persistArtifactGovernanceEvent(event).catch(() => {
			toast.error("Failed to persist governance event");
		});
	};

	return (
		<PageShell>
			<header className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">SIRE Diff</h1>
				<p className="text-sm text-muted-foreground">
					Three-way reconciliation: local ledger vs SUNAT proposal vs optional
					CPE.
				</p>
			</header>
			<div className="space-y-6">
				<div className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
					<label className="space-y-1 text-sm">
						<span className="font-medium">Period (YYYY-MM)</span>
						<input
							className="h-10 w-full rounded-xl border border-border bg-background px-3"
							value={period}
							onChange={(event) => setPeriod(event.target.value)}
						/>
					</label>
					<label className="space-y-1 text-sm">
						<span className="font-medium">SIRE proposal file</span>
						<input
							type="file"
							className="block w-full text-xs"
							onChange={(event) =>
								setSireFile(event.target.files?.[0] ?? undefined)
							}
						/>
					</label>
					<label className="space-y-1 text-sm">
						<span className="font-medium">CPE file (optional)</span>
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
							Run three-way diff
						</Button>
					</div>
				</div>

				<div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<AlertTriangle className="h-4 w-4" />
						Review discrepancies before SUNAT submit.
					</div>
					<Link to={evidenceHref} className="text-primary hover:underline">
						Open expediente evidence
					</Link>
				</div>

				{artifact ? (
					<>
						<SireDiffArtifactCard
							artifact={artifact}
							onEvent={handleArtifactEvent}
						/>
						<DiffViewerV3
							title="Reconciliation summary"
							lines={[
								{
									type: "context",
									content: `Matched: ${artifact.data.summary.matched}`,
								},
								{
									type: "context",
									content: `Mismatched: ${artifact.data.summary.mismatched}`,
								},
								{
									type: "context",
									content: `Missing on ledger: ${artifact.data.summary.missingOnLedger}`,
								},
								{
									type: "context",
									content: `Missing on SUNAT: ${artifact.data.summary.missingOnSunat}`,
								},
								{
									type: artifact.data.summary.critical > 0 ? "remove" : "add",
									content: `Critical rows: ${artifact.data.summary.critical}`,
								},
							]}
						/>
					</>
				) : null}
			</div>
		</PageShell>
	);
}
