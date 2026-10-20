/**
 * Navigation targets that have a screen today. Menu entries and commands that
 * point anywhere else stay hidden instead of leading to a "not found" page.
 * Add a path here when its route lands (a test checks each one exists).
 */
export const AVAILABLE_NAV_PATHS: ReadonlySet<string> = new Set([
	"/cierre-mensual",
	"/tesoreria/reconciliations",
	"/invoices",
	"/cumplimiento/expedientes",
	"/settings",
]);

export function isAvailableNavPath(path: string): boolean {
	return AVAILABLE_NAV_PATHS.has(path);
}
