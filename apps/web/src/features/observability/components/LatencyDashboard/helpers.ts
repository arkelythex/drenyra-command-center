/**
 * Helper utilities for LatencyDashboard.
 */

export function formatMs(ms: number): string {
	if (ms < 1) return `${Math.round(ms * 100) / 100} ms`;
	if (ms < 1000) return `${Math.round(ms)} ms`;
	return `${(ms / 1000).toFixed(2)} s`;
}

export function timeAgo(date: string): string {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function formatDate(date: string): string {
	const d = new Date(date);
	return new Intl.DateTimeFormat("es-PE", {
		day: "numeric",
		month: "short",
	}).format(d);
}

export function truncateId(id: string, len = 12): string {
	if (id.length <= len) return id;
	return `${id.slice(0, 8)}…`;
}
