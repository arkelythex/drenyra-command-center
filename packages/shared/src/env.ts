const ARKELYTHEX_API_KEY = "ARKELYTHEX_API_KEY";
const ARKALYTHIX_API_KEY = "ARKALYTHIX_API_KEY";

/**
 * Resolves the public Arkelythex API key from the environment.
 *
 * Prefers `ARKELYTHEX_API_KEY`; falls back to legacy `ARKALYTHIX_API_KEY`
 * for backward compatibility during the rebrand window.
 */
export function getArkelythexApiKey(
	env: NodeJS.ProcessEnv = process.env,
): string | undefined {
	const primary = env[ARKELYTHEX_API_KEY]?.trim();
	if (primary) return primary;
	const legacy = env[ARKALYTHIX_API_KEY]?.trim();
	return legacy === "" ? undefined : legacy;
}

export { ARKELYTHEX_API_KEY, ARKALYTHIX_API_KEY };
