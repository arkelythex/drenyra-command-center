import type { SunatCredentials, SunatToken } from "./types";
import { SUNAT_OAUTH_URL } from "./types";

export const tokenCache = new Map<number, SunatToken>();

export async function requestNewToken(
	credentials: SunatCredentials,
	fetchFn: (url: string, options: RequestInit) => Promise<Response>,
): Promise<SunatToken> {
	const params = new URLSearchParams({
		grant_type: "client_credentials",
		scope: "https://api.sunat.gob.pe",
		client_id: credentials.clientId,
		client_secret: credentials.clientSecret,
	});

	const response = await fetchFn(`${SUNAT_OAUTH_URL}/oauth2/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`SUNAT OAuth failed: ${response.status} - ${error}`);
	}

	const data = await response.json();

	return {
		accessToken: data.access_token,
		tokenType: data.token_type || "Bearer",
		expiresIn: data.expires_in || 3600,
		expiresAt: new Date(
			Date.now() + (data.expires_in || 3600) * 1000 - 60000,
		),
	};
}
