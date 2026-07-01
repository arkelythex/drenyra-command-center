import type {
	EvidenceSource,
	EvidenceStatus,
	EvidenceType,
} from "@arkelythex/domain";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<EvidenceStatus, { label: string; color: string }> = {
	UPLOADED: { label: "Subido", color: "var(--color-warning)" },
	EXTRACTING: { label: "Extrayendo", color: "var(--color-info)" },
	CLASSIFIED: { label: "Clasificado", color: "var(--color-success)" },
	VALIDATED: { label: "Validado", color: "var(--color-success)" },
	REJECTED: { label: "Rechazado", color: "var(--color-danger)" },
	ERROR: { label: "Error", color: "var(--color-danger)" },
};

const TYPE_LABELS: Record<EvidenceType, string> = {
	INVOICE: "Factura",
	RECEIPT: "Recibo",
	CONTRACT: "Contrato",
	BANK_STATEMENT: "Estado de Cuenta",
	EMAIL: "Correo",
	OTHER: "Otro",
};

const SOURCE_LABELS: Record<EvidenceSource, string> = {
	UPLOAD: "Carga manual",
	EMAIL: "Correo",
	API: "API",
	SYNC: "Sincronización",
};

export function EvidenceDetailPage() {
	const { id } = useParams({ from: "/evidence/$id" });

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[800px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					<Link
						to="/evidence"
						className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
					>
						<ArrowLeft size={14} />
						Volver a evidencia
					</Link>

					<header className="space-y-3">
						<div className="flex items-center gap-3">
							<h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] break-all">
								Evidencia
							</h1>
						</div>
						<p className="text-xs text-[var(--text-tertiary)] font-mono">
							{id}
						</p>
					</header>

					<section className="rounded-2xl border border-[var(--border-subtle)] p-8 text-center space-y-3">
						<Clock size={24} className="mx-auto text-[var(--text-tertiary)]" />
						<p className="text-xs font-bold text-[var(--text-primary)]">
							Cargando detalle de evidencia
						</p>
						<p className="text-2xs text-[var(--text-tertiary)]">
							Conectando con el servidor...
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
