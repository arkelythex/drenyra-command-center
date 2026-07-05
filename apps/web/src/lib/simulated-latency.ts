const DEBUG_LATENCY_KEY = "drenyra-debug-latency";

export function isDebugLatencyEnabled() {
	if (typeof window === "undefined") return false;
	return (
		import.meta.env.DEV &&
		window.localStorage.getItem(DEBUG_LATENCY_KEY) === "1"
	);
}

export async function simulateLatency(delayMs = 0) {
	if (delayMs <= 0) return;
	if (!isDebugLatencyEnabled()) return;

	await new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

export { DEBUG_LATENCY_KEY };
