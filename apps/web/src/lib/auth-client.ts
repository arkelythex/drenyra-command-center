import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function getDefaultBaseUrl(): string {
	if (typeof window !== "undefined" && window.location?.origin)
		return window.location.origin;
	return "http://localhost:5173";
}

export const authClient = createAuthClient({
	// For local dev with Vite proxy, pointing to the web origin keeps cookies same-origin.
	baseURL: import.meta.env.VITE_BETTER_AUTH_URL || getDefaultBaseUrl(),
	plugins: [customSessionClient()],
});

export const { signIn, signOut, signUp } = authClient;

export { authClient as auth };
