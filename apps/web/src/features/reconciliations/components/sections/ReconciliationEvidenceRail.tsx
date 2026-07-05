import {
	AlertTriangle,
	CheckCircle2,
	FileText,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ConfidenceBadge } from "@/components/agentic";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	ReconciliationCandidate,
	ReconciliationTransaction,
} from "../../reconciliation.types";

interface ReconciliationEvidenceRailProps {
	activeCandidate?: ReconciliationCandidate;
	activeTransaction: ReconciliationTransaction;
	onDecision?: (decision: "approve" | "reject" | "manual") => void;
}

export function ReconciliationEvidenceRail({
	activeCandidate,
	activeTransaction,
	onDecision,
}: ReconciliationEvidenceRailProps) {
	const handleDecision = (decision: "approve" | "reject" | "manual") => {
		onDecision?.(decision);

		const messages = {
			approve: "Conciliación aprobada con evidencia visible.",
			reject: "La sugerencia fue rechazada y permanece en revisión.",
			manual: "Se marcó para búsqueda o creación manual de asiento.",
		} as const;

		toast.success(messages[decision]);
	};

	return (
		<aside className="flex min-h-0 flex-col border-l border-border/50 bg-[var(--surface-1)]">
			<div className="border-b border-border/50 px-5 py-4">
				<p className="text-label font-black uppercase tracking-[0.18em] text-muted-foreground">
					Evidence rail
				</p>
				<h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
					Evidencia y decisión
				</h2>
			</div>

			<div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 custom-scrollbar">
				<Card className="border-border/60 bg-[var(--surface-2)]">
					<CardHeader className="border-b border-border/50">
						<CardTitle>Suggested action</CardTitle>
						<CardDescription>
							La recomendación visible no reemplaza la revisión humana.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 p-5">
						<ConfidenceBadge score={activeTransaction.confidence} showLabel />
						<p className="text-sm leading-6 text-[var(--text-secondary)]">
							{activeCandidate
								? activeCandidate.rationale
								: "No hay match confiable. Se recomienda búsqueda manual o crear asiento."}
						</p>
						<div className="rounded-2xl border border-border/60 bg-background p-4">
							<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
								Impacto
							</p>
							<p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
								{activeCandidate?.impact ??
									"No aplicar automatización hasta completar soporte contable."}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-[var(--surface-2)]">
					<CardHeader className="border-b border-border/50">
						<CardTitle>Source records</CardTitle>
						<CardDescription>
							Fuentes visibles antes de decidir.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-5">
						{(
							activeCandidate?.sourceRecords ?? [
								"Extracto bancario activo",
								"No hay evidencia contable vinculada",
							]
						).map((record) => (
							<div
								key={record}
								className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3.5"
							>
								<FileText className="mt-0.5 h-4 w-4 shrink-0 text-info" />
								<p className="text-sm leading-6 text-[var(--text-secondary)]">
									{record}
								</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-[var(--surface-2)]">
					<CardHeader className="border-b border-border/50">
						<CardTitle>Proposed diff</CardTitle>
						<CardDescription>
							Cambios que se aplicarían si apruebas.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-5">
						{(
							activeCandidate?.proposedDiff ?? [
								"Mantener movimiento en cola",
								"Solicitar soporte o crear asiento manual",
							]
						).map((diff) => (
							<div
								key={diff}
								className="rounded-2xl border border-border/60 bg-background px-4 py-3.5"
							>
								<p className="text-sm leading-6 text-[var(--text-secondary)]">
									{diff}
								</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-[var(--surface-2)]">
					<CardHeader className="border-b border-border/50">
						<CardTitle>Decision</CardTitle>
						<CardDescription>
							Toda acción sensible debe dejar rastro explícito.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 p-5">
						<div className="rounded-2xl border border-warning-subtle bg-warning-subtle p-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
								<p className="text-sm leading-6 text-[var(--text-secondary)]">
									{activeTransaction.confidence < 80
										? "Confianza insuficiente para aprobación rápida. Se recomienda revisión manual."
										: "La evidencia es suficiente para decidir sin salir de la vista."}
								</p>
							</div>
						</div>

						<div className="grid gap-3">
							<Button
								onClick={() => handleDecision("approve")}
								disabled={!activeCandidate}
							>
								<CheckCircle2 className="mr-2 h-4 w-4" />
								Approve match
							</Button>
							<Button
								variant="outline"
								onClick={() => handleDecision("reject")}
							>
								Reject suggestion
							</Button>
							<Button variant="ghost" onClick={() => handleDecision("manual")}>
								Request manual review
							</Button>
						</div>

						<div className="rounded-2xl border border-border/60 bg-background p-4">
							<div className="flex items-start gap-3">
								<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" />
								<p className="text-sm leading-6 text-[var(--text-secondary)]">
									El rail mantiene la fuente, el impacto, el diff propuesto y la
									acción tomada en un solo lugar.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</aside>
	);
}
