/**
 * Dónde mostrar chrome de conversión (WhatsApp, floating demo, sticky panel).
 * La home (`/`) es presentación de marca; producto y ventas llevan CTAs.
 */

/** Rutas con shell de documentación (sin navbar marketing ni CTAs flotantes). */
export function isDocsEntryPath(pathname: string | null): boolean {
	return pathname === "/api" || (pathname?.startsWith("/docs") ?? false);
}

const CONVERSION_PATH_PREFIXES = [
	"/drenyra",
	"/demo",
	"/precios",
	"/sire",
	"/ledger",
	"/studio",
	"/cortex",
	"/seguridad",
] as const;

/** Home corporativa: narrativa + ecosistema, sin funnels de cuenta o contacto. */
export function isBrandHome(pathname: string | null): boolean {
	return pathname === "/";
}

export function shouldShowConversionChrome(pathname: string | null): boolean {
	if (!pathname || isBrandHome(pathname)) {
		return false;
	}

	return CONVERSION_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}
