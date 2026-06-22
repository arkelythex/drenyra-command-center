const DEV_TRUSTED_ORIGIN_DEFAULTS = [
	"http://localhost:3000",
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:4173",
	"http://127.0.0.1:4173",
];

export function resolveTrustedOriginsFromEnv(
	envValue: string | undefined,
): string[] {
	const extra =
		envValue
			?.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean) ?? [];
	return [...new Set([...DEV_TRUSTED_ORIGIN_DEFAULTS, ...extra])];
}

