/** Tipos de mensajes en el chat fiscal */

export type MessageRole = "user" | "assistant" | "system";

export type ChatIntent =
	| "consulta"
	| "approve"
	| "reject"
	| "show-detail"
	| "list-pending"
	| "unknown";

export interface EvidenceSource {
	tipo: string;
	serie: string;
	numero: number;
	monto: number;
	moneda: string;
	cdrHash?: string;
	fecha: string;
}

export interface RecommendationData {
	id: string;
	descripcion: string;
	monto: number;
	moneda: string;
	confianza: number;
	status: string;
	ruc: string;
	periodo: string;
	fuentes?: EvidenceSource[];
}

export interface ConsultaData {
	tipo: string;
	ruc: string;
	periodo: string;
	resultado: Record<string, unknown>;
	confianza: number;
	fuentes: EvidenceSource[];
}

export interface ChatMessage {
	id: string;
	role: MessageRole;
	text: string;
	timestamp: Date;
	/** Rich content attached to the message */
	content?: {
		kind:
			| "consulta-result"
			| "approval-card"
			| "approval-list"
			| "evidence"
			| "error";
		data:
			| ConsultaData
			| RecommendationData
			| RecommendationData[]
			| EvidenceSource[];
	};
}

export interface ParsedChatInput {
	intent: ChatIntent;
	entityId?: string;
	motivo?: string;
	queryText?: string;
}
