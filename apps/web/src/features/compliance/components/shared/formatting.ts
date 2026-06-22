import { n } from "@/lib/utils";

/**
 * Formatting utilities for ARKELYTHEX compliance display.
 */

/**
 * Formats a number as Peruvian Sol currency (PEN).
 */
export function formatMoney(value: number): string {
	return n(value);
}

/**
 * Formats an ISO datetime string to a human-readable Spanish date+time.
 */
export function formatDateTime(iso: string): string {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(iso));
}

/**
 * Formats year and month integers into a period string like "2026-03".
 */
export function formatPeriod(year: number, month: number): string {
	return `${year}-${String(month).padStart(2, "0")}`;
}
