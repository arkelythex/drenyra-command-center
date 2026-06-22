export interface Document {
	id: string;
	name: string;
	type: "PDF" | "XML" | "CSV";
	category: "FACTURA (01)" | "BOLETA (03)" | "RECIBO (02)" | "DATA";
	ruc: string;
	series: string;
	size: string;
	date: string;
	amount?: number;
	status: "linked" | "unlinked";
	hasCDR: boolean;
	thumbnailColor: string;
}

export type DocumentStatus = Document["status"];

export type ViewMode = "grid" | "list";
