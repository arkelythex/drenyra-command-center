import type { ExpedienteFiscal } from "@drenyra/domain";
import { EXPEDIENTE_KIND_LABELS } from "@drenyra/domain";
import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFiscalInspector } from "@/context/FiscalInspectorContext";
import { buildSireDiffHref } from "@/features/sire/buildExpedienteEvidenceHref";
import { cn } from "@/lib/utils";

interface DetailBadgeProps {
	label: string;
	value: string;
	color?: string;
}

function DetailBadge({ label, value, color }: DetailBadgeProps) {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-3 py-2">
			<p className="text-3xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
				{label}
			</p>
			<p
				className="text-xs font-bold"
				style={{ color: color ?? "var(--text-primary)" }}
			>
				{value}
			</p>
		</div>
	);
}

export interface ExpedienteDetailProps {
	expediente: ExpedienteFiscal;
}

export function ExpedienteDetail({ expediente: exp }: ExpedienteDetailProps) {
	const { open: openInspector } = useFiscalInspector();

	const fiscalStatus =
		exp.status === "CERRADO"
			? "EVIDENCED"
			: exp.status === "PENDIENTE_APROBACION"
				? "PROPOSED"
				: "DETECTED";

	return (
		<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 space-y-5">
			<div className="space-y-2">
				<span className="text-3xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
					{EXPEDIENTE_KIND_LABELS[exp.kind]}
				</span>
				<h2 className="text-sm font-bold text-[var(--text-primary)]">
					{exp.titulo}
				</h2>
				<p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
					{exp.descripcion}
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<DetailBadge label="Documentos" value={String(exp.totalDocuments)} />
				<DetailBadge
					label="Pendientes"
					value={String(exp.pendingActions)}
					color="var(--color-warning)"
				/>
				<DetailBadge label="RUC" value={exp.companyRuc} />
				<DetailBadge label="Período" value={exp.periodo} />
			</div>

			{exp.requiredApprovers.length > 0 && (
				<div className="space-y-2">
					<h3 className="text-3xs font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
						Aprobadores
					</h3>
					{exp.requiredApprovers.map((a) => {
						const hasApproved = exp.approvedBy.includes(a);
						return (
							<div
								key={a}
								className={cn(
									"flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-2xs font-bold",
									hasApproved
										? "border-[var(--color-success)]/20 bg-[var(--color-success)]/4 text-[var(--color-success)]"
										: "border-[var(--border-subtle)] text-[var(--text-tertiary)]",
								)}
							>
								{hasApproved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
								{a}
							</div>
						);
					})}
				</div>
			)}

			{(exp.kind === "SIRE_VENTAS" || exp.kind === "SIRE_COMPRAS") && (
				<Link
					to={buildSireDiffHref({ period: exp.periodo })}
					className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-3 text-2xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
				>
					<ArrowRightLeft size={12} />
					Open SIRE Diff
				</Link>
			)}

			<div className="flex gap-2 pt-2">
				<Button
					size="sm"
					className="flex-1 h-8 text-2xs font-bold"
					onClick={() =>
						openInspector({
							traceId: exp.id,
							summary: exp.titulo,
							status: fiscalStatus,
							riskLevel: exp.globalRiskLevel,
							impact: `${exp.kind} - ${exp.periodo}`,
							proposedBy: "system",
							requiresApproval: exp.requiredApprovers.length > 0,
							module: "cierre",
							companyRuc: exp.companyRuc,
							createdAt: exp.createdAt,
							evidence: exp.evidencia,
							requiredApprovers: exp.requiredApprovers,
							approvedBy: exp.approvedBy,
						})
					}
				>
					Inspeccionar
				</Button>
				<Button variant="outline" size="sm" className="h-8 text-2xs font-bold">
					Abrir
				</Button>
			</div>
		</div>
	);
}
