// Stub — Auth client
import type { Session, User } from "../features/auth/types/auth.types";

type AuthResult =
	| { data: { session: Session; user: User }; error: null }
	| { data: null; error: Error };

type CallResult = { error: Error | null };

async function callAuth(path: string, init?: RequestInit): Promise<CallResult> {
	try {
		const res = await fetch(path, init);
		if (res.ok) return { error: null };
		const detail = (await res.json().catch(() => ({}))) as {
			message?: string;
		};
		return { error: new Error(detail.message ?? "Request failed") };
	} catch (cause) {
		return {
			error: cause instanceof Error ? cause : new Error("Request failed"),
		};
	}
}

function postAuth(path: string, body: unknown): Promise<CallResult> {
	return callAuth(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

export const authClient = {
	/** Sends the reset link; `redirectTo` is the page that reads the token. */
	requestPasswordReset(input: { email: string; redirectTo: string }) {
		return postAuth("/api/auth/forget-password", input);
	},
	resetPassword(input: { newPassword: string; token: string }) {
		return postAuth("/api/auth/reset-password", input);
	},
	verifyEmail(input: { query: { token: string } }) {
		const token = encodeURIComponent(input.query.token);
		return callAuth(`/api/auth/verify-email?token=${token}`);
	},
	sendVerificationEmail(input: { email: string; callbackURL: string }) {
		return postAuth("/api/auth/send-verification-email", input);
	},
	async signIn(email: string, password: string): Promise<AuthResult> {
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (!res.ok) return { data: null, error: new Error("Login failed") };
		return { data: await res.json(), error: null };
	},
	async signOut() {
		await fetch("/api/auth/logout", { method: "POST" });
	},
	async getSession(): Promise<Session | null> {
		const res = await fetch("/api/auth/session");
		if (!res.ok) return null;
		return (await res.json()).session ?? null;
	},
};
