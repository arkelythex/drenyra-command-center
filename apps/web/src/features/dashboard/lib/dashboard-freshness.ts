export function formatDashboardFreshness(timestamp: number): string {
	if (!Number.isFinite(timestamp) || timestamp <= 0) {
		return "Sin sincronización reciente";
	}

	return new Intl.DateTimeFormat("es-PE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(timestamp));
}
