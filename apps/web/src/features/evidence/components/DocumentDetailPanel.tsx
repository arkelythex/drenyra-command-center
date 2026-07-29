import type { EvidenceDetail } from "../hooks/useEvidence";
import { useEvidenceDetail } from "../hooks/useEvidence";

interface DocumentDetailPanelProps {
	evidenceId: string;
}

interface MetadataItemProps {
	label: string;
	value: string;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const index = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function MetadataItem({ label, value }: MetadataItemProps) {
	return (
		<div>
			<dt className="text-2xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
				{label}
			</dt>
			<dd className="mt-1 break-all text-sm text-[var(--text-primary)]">{value}</dd>
		</div>
	);
}

function DocumentMetadata({ evidence }: { evidence: EvidenceDetail }) {
	return (
		<dl className="grid gap-4 sm:grid-cols-2">
			<MetadataItem label="Tipo" value={evidence.evidenceType} />
			<MetadataItem label="Estado" value={evidence.status} />
			<MetadataItem label="Tamaño" value={formatBytes(evidence.sizeBytes)} />
			<MetadataItem
				label="Fecha"
				value={new Date(evidence.createdAt).toLocaleString("es-PE")}
			/>
			<MetadataItem label="Hash" value={evidence.hash} />
			<MetadataItem label="MIME type" value={evidence.mimeType} />
		</dl>
	);
}

export function DocumentDetailPanel({ evidenceId }: DocumentDetailPanelProps) {
	const evidence = useEvidenceDetail(evidenceId);

	if (evidence.isPending) {
		return <p className="text-sm text-[var(--text-tertiary)]">Cargando documento...</p>;
	}

	if (evidence.isError) {
		return (
			<div>
				<p className="text-sm font-medium text-[var(--text-primary)]">
					No se pudo cargar el documento
				</p>
				<p className="mt-1 text-xs text-[var(--text-tertiary)]">
					{evidence.error.message}
				</p>
			</div>
		);
	}

	if (!evidence.data) return null;

	return (
		<div className="space-y-4">
			<header>
				<h2 className="break-all text-base font-semibold text-[var(--text-primary)]">
					{evidence.data.filename}
				</h2>
				<p className="mt-1 font-mono text-2xs text-[var(--text-tertiary)]">
					{evidenceId}
				</p>
			</header>
			<section>
				<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
					Metadatos
				</h3>
				<DocumentMetadata evidence={evidence.data} />
			</section>
			<section>
				<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
					Validaciones
				</h3>
				{evidence.data.validations?.length ? (
					<ul className="space-y-2">
						{evidence.data.validations.map((validation, index) => (
							<li
								key={`${evidenceId}-${index}`}
								className="rounded-lg bg-[var(--surface-2)] p-3 font-mono text-xs text-[var(--text-secondary)]"
							>
								{JSON.stringify(validation)}
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-[var(--text-tertiary)]">
						Este documento todavía no fue validado.
					</p>
				)}
			</section>
			<section>
				<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
					Origen
				</h3>
				<dl className="grid gap-4 sm:grid-cols-2">
					<MetadataItem label="Fuente" value={evidence.data.source} />
					<MetadataItem
						label="Empresa"
						value={evidence.data.companyId ?? "Sin empresa asignada"}
					/>
				</dl>
			</section>
			<section>
				<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
					Entidades vinculadas
				</h3>
				{evidence.data.links.length ? (
					<ul className="space-y-2">
						{evidence.data.links.map((link) => (
							<li
								key={link.id}
								className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-secondary)]"
							>
								{link.entityType}: {link.entityId} · {link.relationship}
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-[var(--text-tertiary)]">
						No hay entidades vinculadas.
					</p>
				)}
			</section>
		</div>
	);
}
