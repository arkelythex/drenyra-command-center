export type Screen =
	| "dashboard"
	| "smart-entry"
	| "audit"
	| "logistics"
	| "reports"
	| "settings";

export interface Lot {
	id: string;
	name: string;
	crop: string;
	status: "cosechado" | "en-proceso" | "espera" | "alerta";
	progress: number;
	alertType?: "riego" | "plaga" | null;
	details?: {
		responsible: string;
		startTime: string;
		weight?: string;
		boxes?: number;
	};
}

export interface AuditRecord {
	id: string;
	lotId: string;
	crop: string;
	date: string;
	time: string;
	compliance: number;
	status: "listo" | "falta-firma" | "falta-foto";
	senasaStatus: "ok" | "pendiente";
}
