/**
 * Shared error codes for the Arkelythex API.
 *
 * Each feature domain exports its error codes from this central file
 * to ensure consistency across routes, services, and API responses.
 */

// --- Thread System ---

export const ThreadErrorCodes = {
	THREAD_NOT_FOUND: "THREAD_NOT_FOUND",
	THREAD_INVALID_TRANSITION: "THREAD_INVALID_TRANSITION",
	THREAD_NO_TASKS: "THREAD_NO_TASKS",
	THREAD_TASKS_INCOMPLETE: "THREAD_TASKS_INCOMPLETE",
	THREAD_ALREADY_CLOSED: "THREAD_ALREADY_CLOSED",
	THREAD_EVIDENCE_ALREADY_LINKED: "THREAD_EVIDENCE_ALREADY_LINKED",
	THREAD_COMPANY_MISMATCH: "THREAD_COMPANY_MISMATCH",
	THREAD_INVALID_PERIOD: "THREAD_INVALID_PERIOD",
} as const;

export type ThreadErrorCode =
	(typeof ThreadErrorCodes)[keyof typeof ThreadErrorCodes];
