export function formatDate(date: Date): string {
	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
}

export function formatDateOptional(date?: Date): string {
	if (!date) return "";
	return formatDate(date);
}

export function formatDecimal(value: number): string {
	return value.toFixed(2);
}

export function formatDecimalOptional(value?: number): string {
	if (value === undefined || value === null) return "";
	return formatDecimal(value);
}

export function calculateChecksum(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}
