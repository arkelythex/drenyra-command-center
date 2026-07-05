import type { RunFilter } from "./hub-context-aside.types";

export const RUN_FILTERS: ReadonlyArray<{ id: RunFilter; label: string }> = [
	{ id: "ALL", label: "Todos" },
	{ id: "AWAITING_APPROVAL", label: "Revisión" },
	{ id: "RUNNING", label: "En curso" },
	{ id: "COMPLETED", label: "Listo" },
] as const;

export const RUN_STATUS_LABEL: Record<string, string> = {
	AWAITING_APPROVAL: "Revisión",
	RUNNING: "En curso",
	QUEUED: "En cola",
	FAILED: "Falló",
	CANCELLED: "Cancelado",
	COMPLETED: "Listo",
} as const;

export const RUN_STATUS_TONE: Record<string, string> = {
	FAILED: "text-danger",
	AWAITING_APPROVAL: "text-warning",
	RUNNING: "text-info",
	QUEUED: "text-info",
	COMPLETED: "text-[var(--color-success)]",
} as const;

export const EMPTY_STATE_MESSAGE: Record<RunFilter, string> = {
	ALL: "Todavía no hay trabajos persistentes para esta empresa.",
	AWAITING_APPROVAL: "No hay trabajos en revisión para este filtro.",
	RUNNING: "No hay trabajos en curso para este filtro.",
	COMPLETED: "No hay trabajos en estado completado para este filtro.",
} as const;

export const MAX_VISIBLE_SKILLS = 4;
export const MAX_VISIBLE_DOCUMENTS = 4;
export const MAX_VISIBLE_RUNS = 4;
