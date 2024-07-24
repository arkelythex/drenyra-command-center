import { createLogger } from "../../../lib/logger";

const logger = createLogger({
	feature: "auth",
	handler: "resolve-social-providers",
});

interface SocialProviderEnv {
	clientId: string;
	clientSecret: string;
}

interface SocialProvidersConfig {
	google?: SocialProviderEnv;
	github?: SocialProviderEnv;
}

function resolveProvider(
	providerId: "google" | "github",
	clientId: string | undefined,
	clientSecret: string | undefined,
): SocialProviderEnv | undefined {
	if (!clientId) {
		return undefined;
	}

	if (!clientSecret) {
		logger.warn(
			{ provider: providerId },
			`Incomplete ${providerId === "google" ? "Google" : "GitHub"} OAuth configuration: CLIENT_ID is set but CLIENT_SECRET is missing. Provider will NOT be registered.`,
		);
		return undefined;
	}

	return {
		clientId,
		clientSecret,
	};
}

/**
 * resolveSocialProvidersFromEnv resolves OAuth social providers from
 * environment variables at server startup.
 *
 * Each provider is conditionally registered only when both its CLIENT_ID
 * and CLIENT_SECRET environment variables are present. An incomplete pair
 * (ID set but secret missing) produces a warning and the provider is
 * NOT registered.
 */
export function resolveSocialProvidersFromEnv(): SocialProvidersConfig {
	const config: SocialProvidersConfig = {};

	const google = resolveProvider(
		"google",
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
	);
	if (google) {
		config.google = google;
	}

	const github = resolveProvider(
		"github",
		process.env.GITHUB_CLIENT_ID,
		process.env.GITHUB_CLIENT_SECRET,
	);
	if (github) {
		config.github = github;
	}

	return config;
}
