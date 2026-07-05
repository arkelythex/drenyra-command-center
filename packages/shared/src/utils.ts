import { type ClassValue, clsx } from "clsx";
import type { Currency } from "@drenyra/domain";

/**
 * Merges conditional class names (clsx) and resolves Tailwind conflicts (tailwind-merge).
 *
 * @param inputs - Class values (strings, arrays, objects) supported by `clsx`
 * @returns A single merged class string
 *
 * @example
 * ```ts
 * const className = cn("p-2", isActive && "bg-blue-500", "p-4"); // "bg-blue-500 p-4"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
	// Keep `@drenyra/shared` dependency-light. If you want Tailwind conflict
	// resolution, install and use `tailwind-merge` at the app layer.
	return clsx(inputs);
}

/**
 * Formats a numeric amount as currency for Peru/US display.
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: "PEN")
 * @returns Formatted amount including currency symbol
 *
 * @example
 * ```ts
 * formatCurrency(10, "PEN"); // "S/ 10.00"
 * ```
 */
export function formatCurrency(
	amount: number,
	currency: Currency = "PEN",
): string {
	const symbol = currency === "PEN" ? "S/" : currency === "USD" ? "$" : "€";
	return `${symbol} ${amount.toFixed(2)}`;
}

/**
 * Formats a date as `dd/mm/yyyy` using the `es-PE` locale.
 *
 * @param date - Date instance or ISO/date string
 * @returns Localized date string
 *
 * @example
 * ```ts
 * formatDate("2026-02-03"); // "03/02/2026" (depending on environment)
 * ```
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("es-PE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

/**
 * Formats a date/time using the `es-PE` locale.
 *
 * @param date - Date instance or ISO/date string
 * @returns Localized date/time string
 *
 * @example
 * ```ts
 * formatDateTime(new Date());
 * ```
 */
export function formatDateTime(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleString("es-PE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Formats a Peruvian RUC as `##-########-#` when length is 11.
 *
 * @param ruc - Raw RUC string
 * @returns Formatted RUC or the original input if not 11 chars
 *
 * @example
 * ```ts
 * formatRUC("20123456789"); // "20-12345678-9"
 * ```
 */
export function formatRUC(ruc: string): string {
	if (ruc.length !== 11) return ruc;
	return `${ruc.slice(0, 2)}-${ruc.slice(2, 10)}-${ruc.slice(10)}`;
}

/**
 * Formats a Peruvian DNI as `####-####` when length is 8.
 *
 * @param dni - Raw DNI string
 * @returns Formatted DNI or the original input if not 8 chars
 *
 * @example
 * ```ts
 * formatDNI("12345678"); // "1234-5678"
 * ```
 */
export function formatDNI(dni: string): string {
	if (dni.length !== 8) return dni;
	return `${dni.slice(0, 4)}-${dni.slice(4)}`;
}

/**
 * Creates a debounced version of a function.
 *
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function (invokes `func` after `wait` ms since the last call)
 *
 * @example
 * ```ts
 * const debounced = debounce(() => console.log("run"), 250);
 * debounced();
 * ```
 * @typeParam T - Generic type parameter for debounce.
 */

export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

/**
 * Truncates a string to a max length and appends `...` when needed.
 *
 * @param str - Input string
 * @param length - Maximum length (without the ellipsis)
 * @returns Truncated string
 *
 * @example
 * ```ts
 * truncate("hello world", 5); // "hello..."
 * ```
 */
export function truncate(str: string, length: number): string {
	if (str.length <= length) return str;
	return `${str.slice(0, length)}...`;
}

/**
 * Capitalizes the first letter and lowercases the rest.
 *
 * @param str - Input string
 * @returns Capitalized string
 *
 * @example
 * ```ts
 * capitalize("hOLA"); // "Hola"
 * ```
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Resolves after a given number of milliseconds.
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after `ms`
 *
 * @example
 * ```ts
 * await sleep(100);
 * ```
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
