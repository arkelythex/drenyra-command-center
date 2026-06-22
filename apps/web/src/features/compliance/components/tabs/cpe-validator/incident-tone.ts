export interface IncidentTone {
	label: string;
	className: string;
}

export function getIncidentTone(category?: string): IncidentTone {
	switch (category) {
		case "SUNAT_OBSERVED":
			return {
				label: "Observado",
				className: "border-warning-subtle bg-warning-muted text-warning",
			};
		case "SUNAT_NOT_FOUND":
			return {
				label: "No Existe",
				className: "border-warning-muted bg-warning-soft text-warning",
			};
		case "SUNAT_ANNULLED":
			return {
				label: "Anulado",
				className: "border-info-subtle bg-info-subtle text-info",
			};
		case "SUNAT_REJECTED":
		case "RUC_MISMATCH":
		case "SCHEMA_INVALID":
			return {
				label: "Bloqueante",
				className: "border-destructive/20 bg-destructive/10 text-destructive",
			};
		case "NONE":
			return {
				label: "Sin Incidente",
				className: "border-success-subtle bg-success-muted text-success",
			};
		default:
			return {
				label: "Revision",
				className: "border-border bg-muted text-foreground",
			};
	}
}
