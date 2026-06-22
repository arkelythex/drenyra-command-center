import type { DrenyraFiscalWorkInspectEnvelope } from "../api/drenyra-fiscal-work.api";

interface FiscalWorkInspectStatusProps {
	envelope?: DrenyraFiscalWorkInspectEnvelope;
}

export function FiscalWorkInspectStatus({
	envelope,
}: FiscalWorkInspectStatusProps) {
	if (!envelope || envelope.status === "success") return null;

	return (
		<section
			role="status"
			aria-label="Estado de inspección fiscal"
			className="mt-5 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3 text-xs text-[var(--text-secondary)]"
		>
			<p className="font-bold text-[var(--color-warning)]">
				Inspección fiscal no disponible: {envelope.reasonCode}
			</p>
			<p className="mt-1">
				{envelope.redactedDetail ??
					"No se devolvieron datos fiscales para esta solicitud."}
			</p>
			<p className="mt-2 font-mono text-2xs">trace: {envelope.traceId}</p>
		</section>
	);
}
