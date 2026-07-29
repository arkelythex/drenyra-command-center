import { Link } from "@tanstack/react-router";
import type {
	EvidenceItem,
	EvidenceLink,
	EvidenceRelationship,
} from "../hooks/useEvidence";
import { useEvidenceLineage } from "../hooks/useEvidence";

const EVIDENCE_ENTITY_TYPES = {
	JOURNAL_ENTRY: "journal_entry",
	THREAD: "thread",
	DIFF: "diff",
	AGENT_RUN: "agent_run",
} as const;

const RELATIONSHIP_LABELS: Record<EvidenceRelationship, string> = {
	source: "Fuente",
	supporting: "Respaldo",
	output: "Resultado",
	audit_trail: "Auditoría",
};

export type EvidenceEntityType =
	(typeof EVIDENCE_ENTITY_TYPES)[keyof typeof EVIDENCE_ENTITY_TYPES];

interface EvidenceLineageEntry extends EvidenceLink {
	evidence: EvidenceItem | null;
}

interface EvidenceLineageEntity {
	type: string;
	id: string;
}

interface EvidenceLineageData {
	entity: EvidenceLineageEntity;
	evidence: EvidenceLineageEntry[];
}

interface EvidenceLineagePanelProps {
	entityType: EvidenceEntityType;
	entityId: string;
}

export function EvidenceLineagePanel({
	entityType,
	entityId,
}: EvidenceLineagePanelProps) {
	const lineage = useEvidenceLineage(entityType, entityId);
	const data = lineage.data as EvidenceLineageData | undefined;

	return (
		<section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
			<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
			Evidencia vinculada
			</h3>
			{lineage.isPending && (
				<p className="mt-3 text-sm text-[var(--text-tertiary)]">
					Cargando evidencia vinculada...
				</p>
			)}
			{lineage.isError && (
				<div className="mt-3">
					<p className="text-sm font-medium text-[var(--text-primary)]">
						No se pudo cargar la evidencia vinculada
					</p>
					<p className="mt-1 text-xs text-[var(--text-tertiary)]">
						{lineage.error.message}
					</p>
				</div>
			)}
			{data && data.evidence.length === 0 && (
				<p className="mt-3 text-sm text-[var(--text-tertiary)]">
					No hay evidencia vinculada a esta entidad.
				</p>
			)}
			{data && data.evidence.length > 0 && (
				<ul className="mt-3 space-y-2">
					{data.evidence.map((entry) => {
						const item = entry.evidence;
						const date = item?.createdAt ?? entry.linkedAt;

						return (
							<li
								key={entry.id}
								className="rounded-xl bg-[var(--surface-2)] p-3"
							>
								{item ? (
									<Link
										to="/evidence/$id"
										params={{ id: item.id }}
										className="block text-sm font-medium text-[var(--color-primary)] hover:underline"
									>
										{item.filename}
									</Link>
								) : (
									<p className="text-sm font-medium text-[var(--text-primary)]">
										Evidencia no disponible
									</p>
								)}
								<div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-[var(--text-tertiary)]">
									<span>{item?.evidenceType ?? "Sin tipo"}</span>
									<span>{RELATIONSHIP_LABELS[entry.relationship]}</span>
									<span>{new Date(date).toLocaleDateString("es-PE")}</span>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
