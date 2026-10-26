import { AlertTriangle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { type ChangeEvent, useRef } from "react";
import { cn, n } from "@/lib/utils";
import { useSireReconciliation } from "../hooks/useSireReconciliation";
import {
	type ReconciliationStats,
	SIRE_DISCREPANCY_LABELS,
	type SireDiscrepancy,
} from "../types/sire.types";

const EMPTY_STATS: ReconciliationStats = {
	totalSunat: 0,
	totalLocal: 0,
	matchCount: 0,
	discrepancyCount: 0,
	igvGap: 0,
};

const primaryButtonClass =
	"inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60";

/**
 * SIRE reconciliation: compares the SUNAT proposal (RVIE/RCE file downloaded
 * from SOL) with Drenyra's records. Presentation only; matching lives in
 * useSireReconciliation.
 */
export const SireDashboard = () => {
	const {
		processFile,
		isProcessing,
		discrepancies,
		stats,
		sunatRecords,
		error,
	} = useSireReconciliation();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const resolvedStats = stats ?? EMPTY_STATS;
	const openFilePicker = () => fileInputRef.current?.click();

	const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) processFile(e.target.files[0]);
	};

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
			<header className="flex shrink-0 flex-col gap-4 border-b border-border px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
				<div className="space-y-1">
					<h1 className="text-2xl font-medium tracking-tight">
						Conciliación SIRE
					</h1>
					<p className="text-sm text-muted-foreground">
						Registro de ventas y compras (RVIE/RCE) frente a tus registros en
						Drenyra.
					</p>
				</div>
				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					accept=".zip,.txt,.csv"
					aria-label="Subir archivo SIRE"
					onChange={handleUpload}
				/>
				<button
					type="button"
					onClick={openFilePicker}
					disabled={isProcessing}
					className={primaryButtonClass}
				>
					{isProcessing ? (
						<>
							<Loader2
								aria-hidden="true"
								className="size-4 animate-spin motion-reduce:animate-none"
							/>
							Procesando…
						</>
					) : (
						<>
							<FileUp aria-hidden="true" className="size-4" />
							Importar propuesta SIRE
						</>
					)}
				</button>
			</header>

			<div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
				<div className="mx-auto max-w-5xl space-y-8">
					{error && (
						<p
							role="alert"
							className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
						>
							{error}
						</p>
					)}

					{sunatRecords.length === 0 ? (
						<section className="mx-auto max-w-md space-y-3 py-16 text-center">
							<h2 className="text-lg font-medium tracking-tight">
								Aún no hay una propuesta SIRE cargada
							</h2>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Descarga la propuesta del portal SUNAT SOL (.zip, .txt o .csv) y
								cárgala para compararla con tus comprobantes en Drenyra.
							</p>
						</section>
					) : (
						<>
							<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
								<Stat
									label="Total SUNAT"
									value={n(Number(resolvedStats.totalSunat))}
								/>
								<Stat
									label="Total en Drenyra"
									value={n(Number(resolvedStats.totalLocal))}
								/>
								<Stat
									label="Diferencia de IGV"
									value={n(Number(resolvedStats.igvGap))}
									tone={resolvedStats.igvGap !== 0 ? "danger" : "default"}
								/>
								<Stat
									label="Diferencias"
									value={String(resolvedStats.discrepancyCount)}
								/>
							</dl>

							<section className="space-y-3">
								<h2 className="text-base font-medium tracking-tight">
									Diferencias encontradas ({discrepancies.length})
								</h2>

								{discrepancies.length > 0 ? (
									<ul className="divide-y divide-border rounded-xl border border-border bg-card">
										{discrepancies.map((diff: SireDiscrepancy) => {
											const record = diff.recordSunat ?? diff.recordLocal;
											return (
												<li
													key={diff.id}
													className="flex items-start gap-3 px-4 py-3"
												>
													<AlertTriangle
														aria-hidden="true"
														className="mt-0.5 size-4 shrink-0 text-warning"
													/>
													<div className="min-w-0">
														<p className="text-sm font-medium">
															{SIRE_DISCREPANCY_LABELS[diff.type]}
														</p>
														<p className="mt-0.5 truncate text-sm text-muted-foreground">
															<span className="font-mono tabular-nums">
																{record?.serie}-{record?.numero}
															</span>
															{record?.razonSocial
																? ` · ${record.razonSocial}`
																: null}
														</p>
													</div>
												</li>
											);
										})}
									</ul>
								) : (
									<p className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
										<CheckCircle2
											aria-hidden="true"
											className="size-4 text-success"
										/>
										No se encontraron diferencias entre SUNAT y Drenyra en este
										archivo.
									</p>
								)}
							</section>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

interface StatProps {
	label: string;
	value: string;
	tone?: "default" | "danger";
}

const Stat = ({ label, value, tone = "default" }: StatProps) => (
	<div className="space-y-1 bg-card px-4 py-4">
		<dt className="text-xs text-muted-foreground">{label}</dt>
		<dd
			className={cn(
				"font-mono text-xl font-medium tabular-nums tracking-tight",
				tone === "danger" ? "text-destructive" : "text-foreground",
			)}
		>
			{value}
		</dd>
	</div>
);
