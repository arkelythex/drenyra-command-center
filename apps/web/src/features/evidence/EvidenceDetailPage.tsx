import { Button } from "@/components/ui/button";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEvidenceDetail, useValidateEvidence } from "./hooks/useEvidence";

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function MetadataList({ values }: { values: Array<[string, string]> }) {
	return <dl className="grid gap-4 sm:grid-cols-2">{values.map(([label, value]) => <div key={label}><dt className="text-2xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt><dd className="mt-1 break-all text-sm text-[var(--text-primary)]">{value}</dd></div>)}</dl>;
}

export function EvidenceDetailPage() {
	const { id } = useParams({ from: "/evidence/$id" });
	const evidence = useEvidenceDetail(id);
	const validate = useValidateEvidence();

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[800px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-6">
					<Link to="/evidence" className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><ArrowLeft size={14} />Volver a evidencia</Link>
					{evidence.isPending && <section className="rounded-2xl border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-tertiary)]">Cargando detalle de evidencia...</section>}
					{evidence.isError && <section className="rounded-2xl border border-[var(--border-subtle)] p-8 text-center"><p className="text-sm font-semibold text-[var(--text-primary)]">No se pudo cargar la evidencia</p><p className="mt-1 text-xs text-[var(--text-tertiary)]">{evidence.error.message}</p></section>}
					{evidence.data && <>
						<header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="break-all text-xl font-bold tracking-tight text-[var(--text-primary)]">{evidence.data.filename}</h1><p className="mt-1 font-mono text-xs text-[var(--text-tertiary)]">{id}</p></div><Button disabled={validate.isPending} onClick={() => validate.mutate(id)}>{validate.isPending ? "Validando..." : "Validar evidencia"}</Button></header>
						<section className="rounded-2xl border border-[var(--border-subtle)] p-6"><h2 className="mb-5 text-sm font-semibold text-[var(--text-primary)]">Metadatos</h2><MetadataList values={[["Tipo", evidence.data.evidenceType], ["Estado", evidence.data.status], ["Tamaño", formatBytes(evidence.data.sizeBytes)], ["Fecha", new Date(evidence.data.createdAt).toLocaleString()], ["Hash", evidence.data.hash], ["MIME type", evidence.data.mimeType]]} /></section>
						<section className="rounded-2xl border border-[var(--border-subtle)] p-6"><h2 className="mb-5 text-sm font-semibold text-[var(--text-primary)]">Validaciones</h2>{evidence.data.validations?.length ? <ul className="space-y-2 text-xs text-[var(--text-secondary)]">{evidence.data.validations.map((validation, index) => <li key={`${id}-${index}`} className="rounded-lg bg-[var(--surface-2)] p-3 font-mono">{JSON.stringify(validation)}</li>)}</ul> : <p className="text-xs text-[var(--text-tertiary)]">Esta evidencia todavía no fue validada.</p>}</section>
						<section className="rounded-2xl border border-[var(--border-subtle)] p-6"><h2 className="mb-5 text-sm font-semibold text-[var(--text-primary)]">Origen y vínculos</h2><MetadataList values={[["Origen", evidence.data.source], ["Empresa", evidence.data.companyId ?? "Sin empresa asignada"], ["Vínculos", String(evidence.data.links.length)]]} /></section>
					</>}
				</div>
			</div>
		</div>
	);
}
