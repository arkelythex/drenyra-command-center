import { useLineage } from "../hooks/useEvidence";
import { FileText, Link2, Loader2 } from "lucide-react";

const ENTITY_LABELS: Record<string, string> = {
	journal_entry: "Asiento",
	thread: "Thread",
	diff: "Diff",
	agent_run: "Agent Run",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
	source: "Documento origen",
	supporting: "Documento soporte",
	output: "Documento generado",
	audit_trail: "Traza de auditoría",
};

const STATUS_BADGE: Record<string, string> = {
	VALIDATED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
	UPLOADED: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	REJECTED: "bg-red-50 text-red-600",
	ERROR: "bg-red-50 text-red-600",
};

export interface EvidenceLineagePanelProps {
	entityType: string;
	entityId: string;
}

export function EvidenceLineagePanel({
	entityType,
	entityId,
}: EvidenceLineagePanelProps) {
	const { data, isLoading } = useLineage(entityType, entityId);
	const lineage = data?.data;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (!lineage || lineage.evidence.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center">
				<Link2 size={20} className="mx-auto mb-2 text-[var(--text-muted)]" />
				<p className="text-xs font-medium text-[var(--text-muted)]">
					Sin evidencia vinculada
				</p>
				<p className="text-2xs text-[var(--text-muted)] mt-1">
					No hay documentos asociados a este{" "}
					{ENTITY_LABELS[entityType] ?? entityType}.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-1">
			{/* Header */}
			<div className="flex items-center gap-2 px-4 py-2">
				<FileText size={14} className="text-[var(--color-primary)]" />
				<span className="text-xs font-bold text-[var(--text-primary)]">
					Evidencia vinculada ({lineage.evidence.length})
				</span>
			</div>

			{/* Lineage tree */}
			<div className="px-4 pb-4 space-y-2">
				{lineage.evidence.map((link) => (
					<div
						key={link.id}
						className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 transition-all hover:border-[var(--border-default)]"
					>
						{/* Relationship badge */}
						<span className="mb-2 inline-block rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-2xs font-medium text-[var(--text-muted)]">
							{RELATIONSHIP_LABELS[link.relationship] ?? link.relationship}
						</span>

						{link.evidence ? (
							<div className="space-y-1.5">
								<p className="text-xs font-bold text-[var(--text-primary)] truncate">
									{link.evidence.filename}
								</p>
								<div className="flex items-center gap-2">
									<span
										className={`rounded-full px-2 py-0.5 text-2xs font-bold ${
											STATUS_BADGE[link.evidence.status] ?? "bg-[var(--surface-3)] text-[var(--text-muted)]"
										}`}
									>
										{link.evidence.status}
									</span>
									<span className="text-2xs text-[var(--text-muted)]">
										{link.evidence.evidenceType}
									</span>
								</div>
							</div>
						) : (
							<p className="text-xs text-[var(--text-muted)] italic">
								Documento no disponible
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
