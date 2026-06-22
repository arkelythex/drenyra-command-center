import { FileCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import type { EvidenceListProps } from "../FiscalInspector.types";
import { FiscalInspectorSection } from "./FiscalInspectorSection";

/**
 * Lists evidence items attached to a fiscal action with verification status.
 */
export function FiscalInspectorEvidence({ evidence }: EvidenceListProps) {
	return (
		<FiscalInspectorSection title={`Evidencia (${evidence.length})`}>
			{evidence.length === 0 ? (
				<p className="text-2xs text-[var(--color-text-muted)] py-2">
					Sin evidencia adjunta para esta acción.
				</p>
			) : (
				<div className="space-y-1.5">
					{evidence.map((item) => (
						<div
							key={item.id}
							className="flex items-center gap-2 rounded-lg border border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]/30 px-3 py-2"
						>
							<FileCheck
								size={12}
								className={
									item.verified
										? "text-[var(--color-success)]"
										: "text-[var(--color-warning)]"
								}
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-2xs font-bold text-[var(--color-text-primary)]">
									{item.label}
								</p>
								<p className="text-3xs text-[var(--color-text-muted)]">
									{item.kind} · {item.hash.slice(0, 12)}
								</p>
							</div>
							{item.verified ? (
								<CheckCircle2
									size={10}
									className="text-[var(--color-success)] shrink-0"
								/>
							) : (
								<AlertTriangle
									size={10}
									className="text-[var(--color-warning)] shrink-0"
								/>
							)}
						</div>
					))}
				</div>
			)}
		</FiscalInspectorSection>
	);
}
