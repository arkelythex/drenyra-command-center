/**
 * Parser simple de lenguaje natural para el chat fiscal.
 * Detecta intents: consulta, approve, reject, show-detail, list-pending.
 */
import type { ParsedChatInput } from "./chat-types";

const APPROVE_PATTERNS = [
	/^aprueba\s+(\S+)/i,
	/^aprobar\s+(\S+)/i,
	/^si\s*,\s*aprob(a|ar)\s+(\S+)/i,
	/^(\S+)\s+(aprobado|ok|aceptado)/i,
];

const REJECT_PATTERNS = [
	/^rechaza\s+(\S+)(?:\s+--motivo\s+(.+))?/i,
	/^rechazar\s+(\S+)(?:\s+--motivo\s+(.+))?/i,
	/^no\s*,\s*rechaz(a|ar)\s+(\S+)(?:\s+--motivo\s+(.+))?/i,
];

const SHOW_PATTERNS = [
	/^mostr(a|ar|ame)\s+(\S+)/i,
	/^ver\s+(\S+)/i,
	/^detalle\s+(\S+)/i,
];

const PENDING_PATTERNS = [
	/^(que\s+)?(hay\s+)?pendientes/i,
	/^recomendaciones/i,
	/^lista/i,
];

const CONSULTA_PATTERNS = [
	/^(consulta|consultar|pregunta|dime|decime|quiero saber)\s+/i,
	/^(cu[áa]l\s+(es|fue)\s+el|cu[áa]nto|cu[áa]ndo)/i,
];

/**
 * Parse text input and detect the intent.
 */
export function parseChatInput(text: string): ParsedChatInput {
	const trimmed = text.trim();

	// Approve
	for (const pattern of APPROVE_PATTERNS) {
		const match = trimmed.match(pattern);
		if (match) {
			const id = match[1] ?? match[2] ?? match[3] ?? "";
			return { intent: "approve", entityId: id.toUpperCase() };
		}
	}

	// Reject
	for (const pattern of REJECT_PATTERNS) {
		const match = trimmed.match(pattern);
		if (match) {
			const id = match[1] ?? match[2] ?? "";
			const motivo = match[3] ?? match[4] ?? "";
			return { intent: "reject", entityId: id.toUpperCase(), motivo };
		}
	}

	// Show detail
	for (const pattern of SHOW_PATTERNS) {
		const match = trimmed.match(pattern);
		if (match) {
			const id = match[2] ?? "";
			return { intent: "show-detail", entityId: id.toUpperCase() };
		}
	}

	// List pending
	for (const pattern of PENDING_PATTERNS) {
		if (pattern.test(trimmed)) {
			return { intent: "list-pending" };
		}
	}

	// Explicit consulta commands
	for (const pattern of CONSULTA_PATTERNS) {
		if (pattern.test(trimmed)) {
			return { intent: "consulta", queryText: trimmed };
		}
	}

	// Default: treat as consulta (natural language query)
	return { intent: "consulta", queryText: trimmed };
}

/**
 * Build suggestions for the chat input placeholder.
 */
export function getSuggestions(): string[] {
	return [
		"IGV de julio 2026",
		"qué hay pendiente",
		"aprueba REC-001",
		"rechaza REC-001 --motivo período incorrecto",
		"detalle REC-001",
	];
}
