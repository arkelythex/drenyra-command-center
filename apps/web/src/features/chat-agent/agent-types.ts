/**
 * Chat Agent — Core Types
 *
 * Extensible type system where every Drenyra feature
 * registers its own intents, handlers, and renderers.
 */

// ─── Messages ───────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
	id: string;
	role: MessageRole;
	text: string;
	timestamp: Date;
	richContent?: RichContent;
}

// ─── Rich Content (cada feature registra su tipo) ──────────────────────

export type RichContentKind =
	| "consulta-result"
	| "approval-card"
	| "approval-list"
	| "evidence-list"
	| "skill-list"
	| "automation-list"
	| "feature-grid"
	| "error"
	| (string & {}); // extensible: cualquier feature agrega su tipo

export interface RichContent {
	kind: RichContentKind;
	data: unknown;
}

// ─── Feature Adapter ───────────────────────────────────────────────────

/**
 * Cada feature de Drenyra registra un adapter.
 * El ChatAgent los carga y los usa para parsear intents y ejecutar acciones.
 */
export interface FeatureAdapter {
	/** Identificador único del feature. */
	featureId: string;
	/** Nombre visible (ej: "Consulta Fiscal"). */
	label: string;
	/** Descripción breve para "qué puedo hacer?". */
	description: string;
	/** Palabras clave para descubrimiento. */
	keywords: string[];
	/** Intenta matchear un input de usuario contra este feature. */
	match: (input: string) => FeatureMatch | null;
	/** Renderiza el resultado como RichContent. */
	handle: (match: FeatureMatch) => Promise<ChatMessage>;
}

export interface FeatureMatch {
	featureId: string;
	confidence: number;
	params: Record<string, string | undefined>;
}

// ─── Chat Store ─────────────────────────────────────────────────────────

export interface ChatStore {
	messages: ChatMessage[];
	isLoading: boolean;
	addMessage: (msg: ChatMessage) => void;
	clear: () => void;
}
