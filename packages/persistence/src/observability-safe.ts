/**
 * Helper para llamadas best-effort de observabilidad.
 * Un fallo en métricas o logging nunca altera el flujo del negocio.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeCall<T extends (...args: Parameters<T>) => void>(
	fn: T,
	...args: Parameters<T>
): void {
	try {
		fn(...args);
	} catch {
		// Best-effort: never throw from observability
	}
}
