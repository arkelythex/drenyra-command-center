export function parseIsoDateOrNull(value: string | undefined): Date | null {
	if (!value) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDatePE(date: Date): string {
	return date.toLocaleDateString("es-PE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}
