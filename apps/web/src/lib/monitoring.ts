// Stub — Monitoring
export function captureError(error: Error, _context?: Record<string, unknown>) {
	if (import.meta.env.DEV) console.error("[monitoring]", error);
}

export function initMonitoring() {
	// No-op
}
