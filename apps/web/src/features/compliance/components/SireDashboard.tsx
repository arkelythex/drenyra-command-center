import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	FileJson,
	ShieldCheck,
	UploadCloud,
} from "lucide-react";
import { type ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn, n } from "@/lib/utils";
import { useSireReconciliation } from "../hooks/useSireReconciliation";
import type { ReconciliationStats, SireDiscrepancy } from "../types/sire.types";

const EMPTY_STATS: ReconciliationStats = {
	totalSunat: 0,
	totalLocal: 0,
	matchCount: 0,
	discrepancyCount: 0,
	igvGap: 0,
};

export const SireDashboard = () => {
	const { processFile, isProcessing, discrepancies, stats, sunatRecords } =
		useSireReconciliation();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const resolvedStats = stats ?? EMPTY_STATS;

	const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) processFile(e.target.files[0]);
	};

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background animate-in fade-in duration-200">
			{/* Header: Elite Consistency */}
			<div className="z-20 flex shrink-0 flex-col items-center justify-between gap-6 border-b border-border bg-[var(--bg-1)] px-6 py-6 shadow-sm sm:px-10 md:flex-row">
				<div className="text-center md:text-left w-full md:w-auto">
					<h1 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">
						Conciliación SIRE
					</h1>
					<p className="text-2xs font-black text-muted-foreground/70 tracking-[0.2em] uppercase mt-2 flex items-center justify-center md:justify-start gap-3">
						<ShieldCheck size={14} className="text-primary" />
						Registro de ventas y compras (RVIE/RCE) · Revisión asistida
					</p>
				</div>
				<div className="flex gap-4 w-full md:w-auto">
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept=".zip,.txt,.csv"
						aria-label="Subir archivo SIRE"
						onChange={handleUpload}
					/>
					<Button
						onClick={() => fileInputRef.current?.click()}
						disabled={isProcessing}
						variant="default"
						className="w-full sm:w-auto h-12 px-10 rounded-2xl text-2xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/15 transition-[box-shadow,transform,opacity] duration-150 hover:-translate-y-0.5 active:scale-95"
					>
						{isProcessing ? (
							<span className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-current animate-ping" />
								Procesando
							</span>
						) : (
							<>
								<UploadCloud className="mr-3 h-4 w-4" /> Importar Propuesta SOL
							</>
						)}
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 bg-muted/5 custom-scrollbar pb-40">
				<div className="max-w-7xl mx-auto space-y-12">
					{sunatRecords.length === 0 ? (
						<div
							className="group flex cursor-pointer flex-col items-center justify-center rounded-4xl border-2 border-dashed border-border bg-card py-40 shadow-lg transition-[background-color,border-color] duration-150 hover:bg-muted/30"
							onClick={() => fileInputRef.current?.click()}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									fileInputRef.current?.click();
								}
							}}
						>
							<div className="text-center space-y-8 max-w-lg">
								<div className="h-24 w-24 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary shadow-lg group-hover:scale-105 transition-transform duration-150">
									<FileJson size={48} strokeWidth={1} />
								</div>
								<div className="space-y-3">
									<h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
										Sincroniza Propuesta SIRE
									</h2>
									<p className="text-xs font-bold text-muted-foreground/60 leading-relaxed uppercase tracking-widest px-8">
										Descarga el .zip del portal SOL y cárgalo aquí para iniciar
										la conciliación entre ARKELYTHEX y SUNAT.
									</p>
								</div>
								<Button
									variant="outline"
									className="h-11 px-8 rounded-2xl text-2xs font-black uppercase tracking-widest mt-4 border-border hover:bg-muted/70"
								>
									+ Explorar Almacenamiento
								</Button>
							</div>
						</div>
					) : (
						<>
							{/* Stats Grid: High Precision */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
								<StatBox label="Total SUNAT" value={resolvedStats.totalSunat} />
								<StatBox
									label="Base Interna"
									value={resolvedStats.totalLocal}
								/>
								<StatBox
									label="Diferencial Fiscal"
									value={resolvedStats.igvGap}
									highlight={resolvedStats.igvGap !== 0}
								/>
								<StatBox
									label="Hallazgos"
									value={resolvedStats.discrepancyCount}
									isCount
								/>
							</div>

							{/* Discrepancy List */}
							<div className="space-y-6">
								<div className="flex items-center justify-between px-2">
									<h2 className="text-label font-black uppercase tracking-[0.3em] text-muted-foreground">
										Inconsistencias Detectadas ({discrepancies.length})
									</h2>
									<Button
										variant="ghost"
										size="sm"
										className="text-2xs font-black uppercase tracking-widest text-primary hover:bg-primary/10"
									>
										Exportar acta
									</Button>
								</div>

								<div className="space-y-4">
									{discrepancies.map((diff: SireDiscrepancy) => (
										<div
											key={diff.id}
											className="group flex items-center justify-between rounded-r-[1.5rem] border border-border border-l-4 border-l-warning bg-card p-6 shadow-sm transition-[background-color,border-color] duration-150 hover:bg-muted/20"
										>
											<div className="flex items-center gap-6">
												<div className="flex h-12 w-12 items-center justify-center rounded-xl border border-warning-subtle bg-warning-muted text-warning shadow-inner transition-transform duration-150 group-hover:scale-105">
													<AlertTriangle size={24} />
												</div>
												<div>
													<p className="font-black text-sm uppercase tracking-tight text-foreground/90">
														{diff.type === "MISSING_IN_ARKELYTHEX" &&
															"Omisión: Comprobante en SUNAT no registrado"}
														{diff.type === "MISSING_IN_SUNAT" &&
															"Riesgo: No figura en Portal SIRE"}
														{diff.type === "AMOUNT_MISMATCH" &&
															"Discrepancia: Diferencia de importes"}
													</p>
													<p className="text-xs text-muted-foreground font-mono mt-1.5 opacity-70 tracking-widest uppercase">
														{diff.recordSunat
															? `${diff.recordSunat.serie}-${diff.recordSunat.numero}`
															: `${diff.recordLocal?.serie}-${diff.recordLocal?.numero}`}{" "}
														•{" "}
														{diff.recordSunat?.razonSocial ||
															diff.recordLocal?.razonSocial}
													</p>
												</div>
											</div>

											<Button
												size="sm"
												variant="outline"
												className="h-10 px-6 text-2xs font-black uppercase tracking-widest rounded-xl border-border hover:bg-primary hover:text-primary-foreground shadow-sm"
											>
												Analizar{" "}
												<ArrowRight className="ml-3 h-3 w-3" strokeWidth={3} />
											</Button>
										</div>
									))}
								</div>

								{discrepancies.length === 0 && (
									<div className="rounded-4xl border border-success-subtle bg-success-subtle p-16 text-center shadow-inner">
										<CheckCircle2
											className="mx-auto mb-6 h-14 w-14 animate-zoom text-success"
											strokeWidth={1.5}
										/>
										<h4 className="mb-2 text-xl font-black uppercase tracking-tighter text-success">
											Conciliación Certificada
										</h4>
										<p className="text-xs font-bold uppercase tracking-widest text-success">
											No se detectaron brechas fiscales en el periodo actual.
										</p>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

interface StatBoxProps {
	label: string;
	value: number | string;
	highlight?: boolean;
	isCount?: boolean;
}

const StatBox = ({ label, value, highlight, isCount }: StatBoxProps) => (
	<div className="group space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm transition-[border-color,background-color] duration-150 hover:border-primary/20">
		<p className="text-2xs font-black text-muted-foreground uppercase tracking-[0.25em] group-hover:text-primary transition-colors duration-150">
			{label}
		</p>
		<div className="flex items-baseline gap-1">
			{!isCount && (
				<span className="text-xs font-black text-muted-foreground/40 uppercase">
					S/
				</span>
			)}
			<p
				className={cn(
					"text-3xl font-black font-mono tracking-tighter tabular-nums leading-none",
					highlight ? "text-danger" : "text-foreground",
				)}
			>
				{isCount ? value : n(Number(value))}
			</p>
		</div>
	</div>
);
