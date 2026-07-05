import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CpeErrorCatalogItem } from "../../../hooks/useCpeErrorCatalog";
import type { CpeValidationOutcome } from "../../../hooks/useCpeValidation";
import type { MockCpeRow } from "./cpe-validator.mock";
import { getIncidentTone } from "./incident-tone";

interface CpeIncidentGuidanceCardProps {
	selectedRow: MockCpeRow | null;
	guidance?: CpeErrorCatalogItem;
	validation?: CpeValidationOutcome | null;
	isLoading: boolean;
	isError: boolean;
	onRetry: () => void;
	onValidate: () => void;
	isValidating: boolean;
}

export function CpeIncidentGuidanceCard({
	selectedRow,
	guidance,
	validation,
	isLoading,
	isError,
	onRetry,
	onValidate,
	isValidating,
}: CpeIncidentGuidanceCardProps) {
	const effectiveSupportMessage =
		validation?.supportMessage ??
		validation?.data.incident.supportMessage ??
		guidance?.supportMessage;
	const effectiveSummary =
		validation?.data.incident.summary ?? guidance?.summary;
	const displayCode = validation?.code ?? guidance?.code;
	const incidentTone = getIncidentTone(validation?.data.incident.category);

	return (
		<Card className="border-border/40 shadow-sm">
			<CardContent className="space-y-5 p-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
							Guia Operativa SUNAT
						</p>
						<h3 className="mt-2 text-sm font-black uppercase tracking-tight text-foreground">
							{selectedRow ? selectedRow.document : "Selecciona un comprobante"}
						</h3>
						<p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
							{selectedRow?.provider ?? "Sin incidente seleccionado"}
						</p>
					</div>
					{displayCode ? (
						<span className="rounded-lg border border-border bg-muted px-3 py-1 text-2xs font-black uppercase tracking-widest text-foreground">
							Codigo {displayCode}
						</span>
					) : null}
				</div>

				<Button
					type="button"
					size="sm"
					onClick={onValidate}
					disabled={!selectedRow || isValidating}
					className="shadow-sm"
				>
					{isValidating ? <Loader2 size={14} className="animate-spin" /> : null}
					{isValidating ? "Validando..." : "Validar Seleccion"}
				</Button>

				{isLoading ? (
					<div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
						<Loader2 size={16} className="animate-spin text-muted-foreground" />
						<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
							Cargando guia operativa...
						</p>
					</div>
				) : null}

				{isError ? (
					<div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
						<div className="flex items-center gap-3">
							<AlertTriangle size={16} className="text-destructive" />
							<p className="text-xs font-black uppercase tracking-wide text-destructive">
								No se pudo cargar el catalogo
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="btn-soft"
							onClick={onRetry}
						>
							<RefreshCw size={14} />
							Reintentar
						</Button>
					</div>
				) : null}

				{validation ? (
					<div className="rounded-xl border border-border/60 bg-background p-4">
						<p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
							Resultado de Validacion
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<span className="rounded-lg border border-border bg-muted px-3 py-1 text-2xs font-black uppercase tracking-widest text-foreground">
								HTTP {validation.statusCode}
							</span>
							<span className="rounded-lg border border-border bg-muted px-3 py-1 text-2xs font-black uppercase tracking-widest text-foreground">
								{validation.data.validationSource}
							</span>
							<span className="rounded-lg border border-border bg-muted px-3 py-1 text-2xs font-black uppercase tracking-widest text-foreground">
								{validation.data.status}
							</span>
							{validation.code ? (
								<span className="rounded-lg border border-border bg-muted px-3 py-1 text-2xs font-black uppercase tracking-widest text-foreground">
									{validation.code}
								</span>
							) : null}
							<span
								className={cn(
									"rounded-lg border px-3 py-1 text-2xs font-black uppercase tracking-widest",
									incidentTone.className,
								)}
							>
								{incidentTone.label}
							</span>
						</div>
						{validation.error ? (
							<p className="mt-3 text-xs font-bold leading-relaxed text-muted-foreground">
								{validation.error}
							</p>
						) : null}
					</div>
				) : null}

				{!isLoading && !isError && guidance ? (
					<div className="space-y-4">
						<div className="rounded-xl border border-border/60 bg-muted/20 p-4">
							<p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
								Diagnostico
							</p>
							<p className="mt-2 text-sm font-bold text-foreground">
								{effectiveSummary}
							</p>
							<p className="mt-3 text-xs font-bold leading-relaxed text-muted-foreground">
								{effectiveSupportMessage}
							</p>
						</div>

						<div className="rounded-xl border border-border/60 bg-background p-4">
							<p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
								Acciones Guiadas
							</p>
							<ul className="mt-3 space-y-2">
								{guidance.recommendedActions.map((action) => (
									<li
										key={action}
										className="flex items-start gap-2 text-xs font-bold leading-relaxed text-foreground"
									>
										<span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70" />
										<span>{action}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				) : null}

				{!isLoading && !isError && !guidance ? (
					<div className="rounded-xl border border-border/60 bg-muted/20 p-4">
						<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
							{validation?.success
								? "Comprobante validado sin incidentes operativos. No se requieren acciones guiadas."
								: "Selecciona un comprobante con codigo SUNAT para ver acciones guiadas."}
						</p>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
